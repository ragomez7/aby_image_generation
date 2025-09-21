from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status

from app.config import settings
from app.models.auth import User, UserInDB, TokenData


class AuthService:
    """Authentication service for handling user authentication and JWT tokens."""
    
    def __init__(self):
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        
        # Dummy user data - in production, this would come from a database
        self.dummy_users_db: Dict[str, UserInDB] = {
            "admin": UserInDB(
                id=1,
                username="admin",
                email="admin@example.com",
                full_name="Administrator",
                is_active=True,
                hashed_password=self._get_password_hash("admin")
            )
        }
    
    def _verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash."""
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def _get_password_hash(self, password: str) -> str:
        """Generate hash for a password."""
        return self.pwd_context.hash(password)
    
    def authenticate_user(self, username: str, password: str) -> Optional[UserInDB]:
        """
        Authenticate a user with username and password.
        
        Args:
            username: The username to authenticate
            password: The password to verify
            
        Returns:
            UserInDB object if authentication successful, None otherwise
        """
        user = self.dummy_users_db.get(username)
        if not user:
            return None
        if not self._verify_password(password, user.hashed_password):
            return None
        return user
    
    def create_access_token(self, data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """
        Create a JWT access token.
        
        Args:
            data: Data to encode in the token
            expires_delta: Optional custom expiration time
            
        Returns:
            Encoded JWT token as string
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt
    
    def verify_token(self, token: str) -> TokenData:
        """
        Verify and decode a JWT token.
        
        Args:
            token: JWT token to verify
            
        Returns:
            TokenData object with decoded information
            
        Raises:
            HTTPException: If token is invalid or expired
        """
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            username: str = payload.get("sub")
            user_id: int = payload.get("user_id")
            
            if username is None:
                raise credentials_exception
                
            token_data = TokenData(username=username, user_id=user_id)
            return token_data
            
        except JWTError:
            raise credentials_exception
    
    def get_user_by_username(self, username: str) -> Optional[User]:
        """
        Get user information by username.
        
        Args:
            username: Username to lookup
            
        Returns:
            User object if found, None otherwise
        """
        user_in_db = self.dummy_users_db.get(username)
        if user_in_db:
            return User(
                id=user_in_db.id,
                username=user_in_db.username,
                email=user_in_db.email,
                full_name=user_in_db.full_name,
                is_active=user_in_db.is_active
            )
        return None
    
    def login(self, username: str, password: str) -> Dict[str, Any]:
        """
        Perform user login and return access token.
        
        Args:
            username: Username for login
            password: Password for login
            
        Returns:
            Dictionary containing access token and user information
            
        Raises:
            HTTPException: If authentication fails
        """
        user = self.authenticate_user(username, password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
        access_token = self.create_access_token(
            data={"sub": user.username, "user_id": user.id},
            expires_delta=access_token_expires
        )
        
        # Convert UserInDB to User (remove hashed_password)
        user_response = User(
            id=user.id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            is_active=user.is_active
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user_response
        }


# Global auth service instance
auth_service = AuthService()
