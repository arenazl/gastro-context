"""
Google OAuth authentication service for restaurant management system.
Handles Google Sign-In integration for secure user authentication.
"""

import httpx
import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from urllib.parse import urlencode

from core.config import settings
from models.user import User, UserRole
from core.database import get_db


class GoogleAuthService:
    """Google OAuth authentication service"""
    
    GOOGLE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
    GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = settings.GOOGLE_REDIRECT_URI
    
    def get_auth_url(self, state: Optional[str] = None) -> str:
        """
        Generate Google OAuth authorization URL.
        
        Args:
            state: Optional state parameter for CSRF protection
            
        Returns:
            Google OAuth authorization URL
        """
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "openid email profile",
            "response_type": "code",
            "access_type": "offline",
            "prompt": "consent"
        }
        
        if state:
            params["state"] = state
            
        return f"{self.GOOGLE_OAUTH_URL}?{urlencode(params)}"
    
    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token.
        
        Args:
            code: Authorization code from Google
            
        Returns:
            Token response from Google
            
        Raises:
            httpx.HTTPError: If token exchange fails
        """
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": self.redirect_uri
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(self.GOOGLE_TOKEN_URL, data=data)
            response.raise_for_status()
            return response.json()
    
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """
        Get user information from Google using access token.
        
        Args:
            access_token: Google access token
            
        Returns:
            User information from Google
            
        Raises:
            httpx.HTTPError: If user info request fails
        """
        headers = {"Authorization": f"Bearer {access_token}"}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(self.GOOGLE_USER_INFO_URL, headers=headers)
            response.raise_for_status()
            return response.json()
    
    async def authenticate_user(self, code: str) -> Dict[str, Any]:
        """
        Complete Google OAuth flow and authenticate user.
        
        Args:
            code: Authorization code from Google
            
        Returns:
            Authentication result with user info and JWT tokens
            
        Raises:
            Exception: If authentication fails
        """
        try:
            # Exchange code for tokens
            token_data = await self.exchange_code_for_token(code)
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise ValueError("No access token received from Google")
            
            # Get user information
            user_info = await self.get_user_info(access_token)
            
            # Find or create user in database
            user = await self._find_or_create_user(user_info)
            
            # Generate JWT tokens
            access_token_jwt = self._create_access_token(user)
            refresh_token_jwt = self._create_refresh_token(user)
            
            return {
                "success": True,
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": user.role.value,
                    "is_active": user.is_active
                },
                "access_token": access_token_jwt,
                "refresh_token": refresh_token_jwt,
                "token_type": "bearer",
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "message": "Google authentication failed"
            }
    
    async def _find_or_create_user(self, user_info: Dict[str, Any]) -> User:
        """
        Find existing user or create new one from Google user info.
        
        Args:
            user_info: User information from Google
            
        Returns:
            User object from database
        """
        async with get_db() as db:
            # Try to find existing user by email
            existing_user = await db.execute(
                select(User).where(User.email == user_info["email"])
            )
            user = existing_user.scalar_one_or_none()
            
            if user:
                # Update last login time
                user.last_login = datetime.utcnow()
                await db.commit()
                return user
            
            # Create new user
            new_user = User(
                email=user_info["email"],
                first_name=user_info.get("given_name", ""),
                last_name=user_info.get("family_name", ""),
                hashed_password="",  # No password needed for OAuth users
                role=UserRole.WAITER,  # Default role - can be changed by admin
                is_active=True,
                last_login=datetime.utcnow()
            )
            
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            
            return new_user
    
    def _create_access_token(self, user: User) -> str:
        """
        Create JWT access token for user.
        
        Args:
            user: User object
            
        Returns:
            JWT access token
        """
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        payload = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    def _create_refresh_token(self, user: User) -> str:
        """
        Create JWT refresh token for user.
        
        Args:
            user: User object
            
        Returns:
            JWT refresh token
        """
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        payload = {
            "user_id": user.id,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    def verify_id_token(self, id_token: str) -> Optional[Dict[str, Any]]:
        """
        Verify Google ID token (for client-side authentication).
        
        Args:
            id_token: Google ID token
            
        Returns:
            Decoded token payload if valid, None otherwise
        """
        try:
            # In production, you should verify the token signature
            # For now, we'll decode without verification (NOT RECOMMENDED FOR PRODUCTION)
            decoded = jwt.decode(id_token, options={"verify_signature": False})
            
            # Verify issuer and audience
            if decoded.get("iss") not in ["accounts.google.com", "https://accounts.google.com"]:
                return None
                
            if decoded.get("aud") != self.client_id:
                return None
                
            # Check expiration
            if decoded.get("exp", 0) < datetime.utcnow().timestamp():
                return None
                
            return decoded
            
        except Exception:
            return None


# Global instance
google_auth_service = GoogleAuthService()