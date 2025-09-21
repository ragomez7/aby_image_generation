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


@router.get("/generate/{job_id}/test")
async def websocket_test_page(job_id: str):
    """
    Serve a test page for the WebSocket connection.
    
    Visit: http://localhost:8000/api/v1/generate/{job_id}/test
    """
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>WebSocket Job Monitor - {job_id}</title>
        <style>
            body {{ font-family: Arial, sans-serif; margin: 20px; }}
            .container {{ max-width: 800px; margin: 0 auto; }}
            .status {{ padding: 10px; margin: 10px 0; border-radius: 5px; }}
            .connected {{ background-color: #d4edda; border: 1px solid #c3e6cb; }}
            .disconnected {{ background-color: #f8d7da; border: 1px solid #f5c6cb; }}
            .update {{ background-color: #e2e3e5; border: 1px solid #d6d8db; margin: 5px 0; padding: 10px; }}
            .prediction {{ background-color: #f8f9fa; border-left: 4px solid #007bff; margin: 5px 0; padding: 8px; }}
            pre {{ background-color: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>WebSocket Job Monitor</h1>
            <p><strong>Job ID:</strong> {job_id}</p>
            
            <div id="status" class="status disconnected">
                Status: Disconnected
            </div>
            
            <button onclick="connect()">Connect</button>
            <button onclick="disconnect()">Disconnect</button>
            <button onclick="clearUpdates()">Clear Updates</button>
            
            <h3>Real-time Updates (every 10 seconds)</h3>
            <div id="updates"></div>
        </div>

        <script>
            let ws = null;
            const statusDiv = document.getElementById('status');
            const updatesDiv = document.getElementById('updates');
            
            function connect() {{
                if (ws) {{
                    ws.close();
                }}
                
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${{protocol}}//${{window.location.host}}/api/v1/generate/{job_id}`;
                
                ws = new WebSocket(wsUrl);
                
                ws.onopen = function(event) {{
                    statusDiv.textContent = 'Status: Connected';
                    statusDiv.className = 'status connected';
                    addUpdate('🟢 Connected to WebSocket');
                }};
                
                ws.onmessage = function(event) {{
                    const data = JSON.parse(event.data);
                    addUpdate('📨 Received update', data);
                }};
                
                ws.onclose = function(event) {{
                    statusDiv.textContent = 'Status: Disconnected';
                    statusDiv.className = 'status disconnected';
                    addUpdate('🔴 Disconnected from WebSocket');
                }};
                
                ws.onerror = function(error) {{
                    addUpdate('❌ WebSocket error', error);
                }};
            }}
            
            function disconnect() {{
                if (ws) {{
                    ws.close();
                    ws = null;
                }}
            }}
            
            function clearUpdates() {{
                updatesDiv.innerHTML = '';
            }}
            
            function addUpdate(message, data = null) {{
                const updateDiv = document.createElement('div');
                updateDiv.className = 'update';
                
                const timestamp = new Date().toLocaleTimeString();
                let content = `<strong>[${{timestamp}}]</strong> ${{message}}`;
                
                if (data) {{
                    if (data.type === 'prediction_update' && data.data) {{
                        const pred = data.data;
                        const statusColor = pred.status === 'succeeded' ? '#28a745' : pred.status === 'processing' ? '#ffc107' : pred.status === 'failed' ? '#dc3545' : '#6c757d';
                        content += `
                            <div class="prediction" style="border-left: 3px solid ${{statusColor}}; padding: 10px; margin: 5px 0; background: #f8f9fa;">
                                <strong>🔮 ${{pred.prediction_id}}</strong> <br>
                                <strong>Status:</strong> <span style="color: ${{statusColor}};">${{pred.status}}</span> <br>
                                <strong>URLs:</strong> ${{(pred.urls || []).length}} generated <br>
                                ${{(pred.urls || []).map(url => `<a href="${{url}}" target="_blank">🖼️ View Image</a>`).join(' | ')}}
                                ${{pred.data_removed ? `<br><strong>⚠️ Data Removed:</strong> ${{pred.note || 'Output expired'}}` : ''}}
                                ${{pred.error ? `<br><strong>❌ Error:</strong> ${{pred.error}}` : ''}}
                            </div>
                        `;
                    }} else {{
                        content += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
                    }}
                }}
                
                updateDiv.innerHTML = content;
                updatesDiv.insertBefore(updateDiv, updatesDiv.firstChild);
            }}
            
            // Auto-connect on page load
            window.onload = connect;
        </script>
    </body>
    </html>
    """
    
    return HTMLResponse(content=html_content)
