from typing import Optional
from pydantic import BaseModel, Field


class UserBase(BaseModel):
    """Base user model with common attributes."""
    username: str = Field(..., description="Username for authentication")
    email: Optional[str] = Field(None, description="User email address")
    full_name: Optional[str] = Field(None, description="User's full name")
    is_active: bool = Field(True, description="Whether the user is active")


class User(UserBase):
    """User model with additional fields."""
    id: int = Field(..., description="User ID")
    
    class Config:
        from_attributes = True


class UserInDB(User):
    """User model as stored in database (includes hashed password)."""
    hashed_password: str = Field(..., description="Hashed password")


class LoginRequest(BaseModel):
    """Login request model."""
    username: str = Field(..., description="Username for login", min_length=1)
    password: str = Field(..., description="Password for login", min_length=1)
    
    class Config:
        json_schema_extra = {
            "example": {
                "username": "admin",
                "password": "admin"
            }
        }


class LoginResponse(BaseModel):
    """Login response model."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: User = Field(..., description="User information")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": 1,
                    "username": "admin",
                    "email": "admin@example.com",
                    "full_name": "Administrator",
                    "is_active": True
                }
            }
        }


class Token(BaseModel):
    """Token model."""
    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Token data model for JWT payload."""
    username: Optional[str] = None
    user_id: Optional[int] = None
