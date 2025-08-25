"""
Google OAuth authentication endpoints for restaurant management system.
Provides secure Google Sign-In integration for staff authentication.
"""

import secrets
from typing import Optional
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from core.database import get_db
from services.google_auth import google_auth_service
from models.user import User
from core.auth import get_current_user

router = APIRouter(prefix="/auth/google", tags=["google-auth"])


class GoogleAuthInitRequest(BaseModel):
    """Request to initiate Google OAuth flow"""
    redirect_url: Optional[str] = None


class GoogleAuthCallbackResponse(BaseModel):
    """Response from Google OAuth callback"""
    success: bool
    message: str
    user: Optional[dict] = None
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: Optional[str] = None
    expires_in: Optional[int] = None


class GoogleTokenVerifyRequest(BaseModel):
    """Request to verify Google ID token (for client-side auth)"""
    id_token: str


@router.get("/login")
async def google_login(
    request: Request,
    redirect_url: Optional[str] = None
):
    """
    Initialize Google OAuth flow.
    Redirects user to Google authentication page.
    
    Args:
        redirect_url: Optional URL to redirect to after successful authentication
        
    Returns:
        Redirect to Google OAuth URL
    """
    # Generate state parameter for CSRF protection
    state = secrets.token_urlsafe(32)
    
    # Store state and redirect URL in session (you might want to use Redis in production)
    request.session["oauth_state"] = state
    if redirect_url:
        request.session["redirect_url"] = redirect_url
    
    # Get Google OAuth URL
    auth_url = google_auth_service.get_auth_url(state=state)
    
    return RedirectResponse(url=auth_url)


@router.get("/callback", response_model=GoogleAuthCallbackResponse)
async def google_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None
):
    """
    Handle Google OAuth callback.
    Processes the authorization code and creates user session.
    
    Args:
        code: Authorization code from Google
        state: State parameter for CSRF protection
        error: Error parameter if authentication failed
        
    Returns:
        Authentication result with user info and tokens
    """
    if error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google authentication error: {error}"
        )
    
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code not provided"
        )
    
    # Verify state parameter (CSRF protection)
    stored_state = request.session.get("oauth_state")
    if not stored_state or stored_state != state:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid state parameter - possible CSRF attack"
        )
    
    # Clear stored state
    request.session.pop("oauth_state", None)
    
    try:
        # Authenticate user with Google
        auth_result = await google_auth_service.authenticate_user(code)
        
        if not auth_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=auth_result.get("message", "Authentication failed")
            )
        
        # Check if we should redirect
        redirect_url = request.session.pop("redirect_url", None)
        
        response_data = GoogleAuthCallbackResponse(
            success=True,
            message="Authentication successful",
            user=auth_result["user"],
            access_token=auth_result["access_token"],
            refresh_token=auth_result["refresh_token"],
            token_type=auth_result["token_type"],
            expires_in=auth_result["expires_in"]
        )
        
        if redirect_url:
            # If there's a redirect URL, append tokens as query parameters
            params = {
                "access_token": auth_result["access_token"],
                "token_type": auth_result["token_type"],
                "expires_in": auth_result["expires_in"]
            }
            redirect_url_with_params = f"{redirect_url}?{urlencode(params)}"
            return RedirectResponse(url=redirect_url_with_params)
        
        return response_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication processing failed: {str(e)}"
        )


@router.post("/verify-token", response_model=GoogleAuthCallbackResponse)
async def verify_google_token(
    token_request: GoogleTokenVerifyRequest,
    db: Session = Depends(get_db)
):
    """
    Verify Google ID token for client-side authentication.
    Used when the frontend handles Google Sign-In directly.
    
    Args:
        token_request: Request containing Google ID token
        
    Returns:
        Authentication result with user info and JWT tokens
    """
    try:
        # Verify the Google ID token
        token_data = google_auth_service.verify_id_token(token_request.id_token)
        
        if not token_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired Google token"
            )
        
        # Create user info from token data
        user_info = {
            "email": token_data.get("email"),
            "given_name": token_data.get("given_name", ""),
            "family_name": token_data.get("family_name", ""),
            "name": token_data.get("name", "")
        }
        
        if not user_info["email"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email not found in Google token"
            )
        
        # Find or create user
        user = await google_auth_service._find_or_create_user(user_info)
        
        # Generate JWT tokens
        access_token = google_auth_service._create_access_token(user)
        refresh_token = google_auth_service._create_refresh_token(user)
        
        return GoogleAuthCallbackResponse(
            success=True,
            message="Token verification successful",
            user={
                "id": user.id,
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "role": user.role.value,
                "is_active": user.is_active
            },
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=30 * 60  # 30 minutes
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token verification failed: {str(e)}"
        )


@router.get("/user-info")
async def get_current_google_user(
    current_user: User = Depends(get_current_user)
):
    """
    Get current authenticated user information.
    Requires valid JWT token from Google authentication.
    
    Returns:
        Current user information
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "is_active": current_user.is_active,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
        "hire_date": current_user.hire_date.isoformat() if current_user.hire_date else None
    }


@router.post("/logout")
async def google_logout(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Logout current user.
    Clears session data (in production, you might want to blacklist the JWT token).
    
    Returns:
        Logout confirmation
    """
    # Clear session data
    request.session.clear()
    
    return {
        "success": True,
        "message": "Successfully logged out",
        "user_id": current_user.id
    }


@router.get("/status")
async def google_auth_status():
    """
    Check Google OAuth configuration status.
    Useful for debugging and health checks.
    
    Returns:
        Google OAuth configuration status
    """
    from core.config import settings
    
    return {
        "google_auth_configured": bool(settings.GOOGLE_CLIENT_ID and settings.GOOGLE_CLIENT_SECRET),
        "client_id_set": bool(settings.GOOGLE_CLIENT_ID),
        "client_secret_set": bool(settings.GOOGLE_CLIENT_SECRET),
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "service_available": True
    }