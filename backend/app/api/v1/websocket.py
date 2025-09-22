import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.responses import HTMLResponse

from app.services.websocket_service import websocket_manager

logger = logging.getLogger(__name__)
router = APIRouter()


@router.websocket("/generate/{job_id}")
async def websocket_job_monitor(websocket: WebSocket, job_id: str):
    """
    WebSocket endpoint for monitoring job predictions in real-time.
    
    Connects to: ws://localhost:8000/api/v1/generate/{job_id}
    
    This endpoint:
    1. Accepts WebSocket connections for a specific job_id
    2. Reads prediction_ids from the database for that job
    3. Fetches current status and URLs from Replicate for each prediction (concurrently)
    4. Sends individual prediction_update messages as they arrive (real-time streaming)
    5. Repeats the process every 10 seconds
    
    Args:
        job_id: The unique job identifier to monitor
        
    WebSocket Message Format (sent individually for each prediction):
    {
        "type": "prediction_update",
        "data": {
            "prediction_id": "abc123...",
            "status": "succeeded",
            "urls": ["https://replicate.delivery/pbxt/abc123.webp"]
        }
    }
    
    Note: For a job with N predictions, you will receive N separate messages every 10 seconds.
    """
    logger.info(f"WebSocket connection attempt for job {job_id}")
    
    try:
        # Validate job_id format (should be a valid UUID)
        import uuid
        uuid.UUID(job_id)
    except ValueError:
        logger.warning(f"Invalid job_id format: {job_id}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid job_id format")
        return
    
    try:
        # Accept the WebSocket connection and start monitoring
        await websocket_manager.connect(websocket, job_id)
        
        # Send initial predictions with Replicate status immediately (concurrently)
        prediction_ids = await websocket_manager._get_prediction_ids_from_db(job_id)
        await websocket_manager._send_concurrent_prediction_updates(job_id, prediction_ids)
        
        # Keep connection alive and handle client messages
        while True:
            try:
                # Wait for client messages (though we don't process them currently)
                data = await websocket.receive_text()
                logger.debug(f"Received message from client for job {job_id}: {data}")
                
                # Echo back to confirm connection is alive
                await websocket.send_text(json.dumps({"type": "pong", "message": "Connection alive"}))
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for job {job_id}")
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket message for job {job_id}: {e}")
                break
                
    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected during setup for job {job_id}")
    except Exception as e:
        logger.error(f"Error in WebSocket connection for job {job_id}: {e}")
    finally:
        # Clean up the connection
        websocket_manager.disconnect(websocket, job_id)
