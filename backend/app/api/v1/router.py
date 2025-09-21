from fastapi import APIRouter

from app.api.v1 import auth, generation, websocket


api_router = APIRouter()

# Include authentication routes
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])

# Include generation routes
api_router.include_router(generation.router, tags=["generation"])

# Include WebSocket routes
api_router.include_router(websocket.router, tags=["websocket"])

# Add other routers here as needed
# api_router.include_router(users.router, prefix="/users", tags=["users"])
# api_router.include_router(items.router, prefix="/items", tags=["items"])
