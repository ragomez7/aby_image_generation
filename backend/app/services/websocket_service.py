import asyncio
import json
import uuid
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from sqlalchemy.future import select
import logging
import replicate
import httpx
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

from app.db.base import AsyncSessionFactory
from app.db.models import JobPredictionId
from app.services.generation_service import generation_service
from app.config import settings

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manager for WebSocket connections and job monitoring."""
    
    def __init__(self):
        # Store active connections by job_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Track monitoring tasks
        self.monitoring_tasks: Dict[str, asyncio.Task] = {}
        # Initialize Replicate client (for backup)
        self.replicate_client = replicate.Client(api_token=settings.replicate_api_token)
        # HTTP client for direct API calls
        self.http_client = httpx.AsyncClient()
    
    async def connect(self, websocket: WebSocket, job_id: str):
        """Accept a new WebSocket connection for a specific job."""
        await websocket.accept()
        
        # Add connection to the job's connection set
        if job_id not in self.active_connections:
            self.active_connections[job_id] = set()
        self.active_connections[job_id].add(websocket)
        
        logger.info(f"WebSocket connected for job {job_id}. Total connections: {len(self.active_connections[job_id])}")
        
        # Start monitoring task if not already running for this job
        if job_id not in self.monitoring_tasks:
            self.monitoring_tasks[job_id] = asyncio.create_task(
                self._monitor_job(job_id)
            )
    
    def disconnect(self, websocket: WebSocket, job_id: str):
        """Remove a WebSocket connection."""
        if job_id in self.active_connections:
            self.active_connections[job_id].discard(websocket)
            logger.info(f"WebSocket disconnected for job {job_id}. Remaining connections: {len(self.active_connections[job_id])}")
            
            # If no more connections for this job, stop monitoring
            if not self.active_connections[job_id]:
                del self.active_connections[job_id]
                if job_id in self.monitoring_tasks:
                    self.monitoring_tasks[job_id].cancel()
                    del self.monitoring_tasks[job_id]
                    logger.info(f"Stopped monitoring job {job_id} - no more connections")
    
    async def send_to_job_connections(self, job_id: str, message: dict):
        """Send a message to all connections monitoring a specific job."""
        if job_id not in self.active_connections:
            return
        
        # Create a copy of connections to avoid modification during iteration
        connections = self.active_connections[job_id].copy()
        disconnected = []
        
        for connection in connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception as e:
                logger.warning(f"Failed to send message to WebSocket: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection, job_id)
    
    async def _get_prediction_ids_from_db(self, job_id: str) -> List[str]:
        """Get prediction IDs for a job from the database."""
        try:
            # Validate job_id is a valid UUID
            uuid.UUID(job_id)
            
            async with AsyncSessionFactory() as session:
                result = await session.execute(
                    select(JobPredictionId.prediction_id)
                    .where(JobPredictionId.job_id == uuid.UUID(job_id))
                    .order_by(JobPredictionId.created_at)
                )
                prediction_ids = result.scalars().all()
                return list(prediction_ids)
        except Exception as e:
            logger.error(f"Failed to get prediction IDs for job {job_id}: {e}")
            return []
    
    @retry(
        wait=wait_exponential(multiplier=1, min=4, max=10),
        stop=stop_after_attempt(5),
        retry=retry_if_exception_type(httpx.HTTPStatusError) # Retry on HTTP errors
    )
    async def _get_prediction_from_replicate(self, prediction_id: str) -> dict:
        """Get prediction details from Replicate API using direct HTTP calls."""
        try:
            # Make direct HTTP call to Replicate API
            headers = {
                "Authorization": f"Token {settings.replicate_api_token}",
                "Content-Type": "application/json"
            }
            
            url = f"https://api.replicate.com/v1/predictions/{prediction_id}"
            
            response = await self.http_client.get(url, headers=headers)
            response.raise_for_status()
            
            prediction_data = response.json()
            
            # Extract output/urls based on the actual API response structure
            output = prediction_data.get("output", [])
            data_removed = prediction_data.get("data_removed", False)
            urls = []
            
            # Build response with additional info
            result = {
                "prediction_id": prediction_id,
                "status": prediction_data.get("status", "unknown"),
                "urls": prediction_data.get("urls", []),
                "output": prediction_data.get("output", []),
                "prediction_data": prediction_data,
                "metrics": prediction_data.get("metrics", None) # Added metrics here
            }
            
            # Add additional info for better debugging
            if data_removed:
                result["data_removed"] = True
                result["note"] = "Output data has been removed by Replicate (likely expired)"
                
            return result
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error getting prediction {prediction_id}: {e.response.status_code} - {e.response.text}")
            return {
                "prediction_id": prediction_id,
                "status": "error",
                "urls": [],
                "error": f"HTTP {e.response.status_code}: {e.response.text}"
            }
        except Exception as e:
            logger.error(f"Failed to get prediction {prediction_id} from Replicate: {e}")
            return {
                "prediction_id": prediction_id,
                "status": "error",
                "urls": [],
                "error": str(e)
            }
    
    async def _send_concurrent_prediction_updates(self, job_id: str, prediction_ids: list):
        """Send prediction updates concurrently as they arrive from Replicate API."""
        
        async def fetch_and_send_prediction(prediction_id: str):
            """Fetch a single prediction and send it immediately."""
            try:
                prediction_data = await self._get_prediction_from_replicate(prediction_id)
                await self.send_to_job_connections(job_id, {
                    "type": "prediction_update",
                    "data": prediction_data # Send the entire prediction_data object
                })
                logger.debug(f"Sent prediction update for {prediction_id} to job {job_id}")
            except Exception as e:
                logger.error(f"Error fetching/sending prediction {prediction_id}: {e}")
                # Send error message for this specific prediction
                await self.send_to_job_connections(job_id, {
                    "type": "prediction_update",
                    "data": {
                        "prediction_id": prediction_id,
                        "status": "error",
                        "urls": [],
                        "error": str(e)
                    }
                })
        
        # Create tasks for all predictions and run them concurrently
        if prediction_ids:
            tasks = [fetch_and_send_prediction(pred_id) for pred_id in prediction_ids]
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _monitor_job(self, job_id: str):
        """Monitor a job and send updates every 10 seconds."""
        logger.info(f"Started monitoring job {job_id}")
        
        try:
            while job_id in self.active_connections and self.active_connections[job_id]:
                # Get prediction IDs from database
                prediction_ids = await self._get_prediction_ids_from_db(job_id)
                
                # Send prediction updates concurrently as they arrive
                await self._send_concurrent_prediction_updates(job_id, prediction_ids)
                
                # Wait 10 seconds before next update
                await asyncio.sleep(10)
                
        except asyncio.CancelledError:
            logger.info(f"Monitoring task for job {job_id} was cancelled")
        except Exception as e:
            logger.error(f"Error in monitoring task for job {job_id}: {e}")
        finally:
            logger.info(f"Stopped monitoring job {job_id}")


# Global WebSocket manager instance
websocket_manager = WebSocketManager()
