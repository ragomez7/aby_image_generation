from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.auth import LoginRequest, LoginResponse, User
from app.services.auth_service import auth_service


router = APIRouter()
security = HTTPBearer()


@router.post("/login", response_model=LoginResponse, status_code=status.HTTP_200_OK)
async def login(login_data: LoginRequest):
    """
    Authenticate user and return JWT token.
    
    **Dummy Credentials:**
    - Username: admin
    - Password: admin
    
    Args:
        login_data: Login credentials (username and password)
        
    Returns:
        LoginResponse containing JWT token and user information
        
    Raises:
        HTTPException: 401 if credentials are invalid
    """
    try:
        result = auth_service.login(login_data.username, login_data.password)
        return LoginResponse(**result)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during authentication"
        )


@router.get("/me", response_model=User)
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Get current authenticated user information.
    
    Args:
        credentials: JWT token from Authorization header
        
    Returns:
        User information for the authenticated user
        
    Raises:
        HTTPException: 401 if token is invalid or user not found
    """
    token_data = auth_service.verify_token(credentials.credentials)
    user = auth_service.get_user_by_username(token_data.username)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


@router.post("/verify-token")
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Verify if the provided JWT token is valid.
    
    Args:
        credentials: JWT token from Authorization header
        
    Returns:
        Token verification result with user information
        
    Raises:
        HTTPException: 401 if token is invalid
    """
    token_data = auth_service.verify_token(credentials.credentials)
    user = auth_service.get_user_by_username(token_data.username)
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "valid": True,
        "user": user,
        "token_data": {
            "username": token_data.username,
            "user_id": token_data.user_id
        }
    }
