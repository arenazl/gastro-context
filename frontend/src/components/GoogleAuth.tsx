/**
 * Google OAuth authentication component for restaurant management system.
 * Provides secure Google Sign-In integration for staff authentication.
 * 
 * Features:
 * - Server-side OAuth flow (redirect to Google)
 * - Client-side Google Sign-In (using Google Identity Services)
 * - Automatic token management
 * - Role-based access control
 */

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Types for Google Authentication
interface GoogleUser {
  id: number
  email: string
  first_name: string
  last_name: string
  full_name: string
  role: 'admin' | 'manager' | 'waiter' | 'kitchen' | 'cashier'
  is_active: boolean
}

interface GoogleAuthResponse {
  success: boolean
  message: string
  user?: GoogleUser
  access_token?: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
}

interface GoogleAuthProps {
  onSuccess?: (user: GoogleUser, tokens: { access_token: string; refresh_token: string }) => void
  onError?: (error: string) => void
  redirectTo?: string
  className?: string
  buttonText?: string
  showServerSideOption?: boolean
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (parent: HTMLElement, options: any) => void
          prompt: () => void
        }
      }
    }
  }
}

export const GoogleAuth: React.FC<GoogleAuthProps> = ({
  onSuccess,
  onError,
  redirectTo,
  className = "",
  buttonText = "Sign in with Google",
  showServerSideOption = true
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false)
  const navigate = useNavigate()
  
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002'
  
  // Load Google Identity Services script
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = () => {
      setIsGoogleLoaded(true)
      initializeGoogleSignIn()
    }
    script.onerror = () => {
      console.error('Failed to load Google Identity Services')
      onError?.('Failed to load Google authentication')
    }
    
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])
  
  const initializeGoogleSignIn = () => {
    if (!window.google) return
    
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your_google_client_id_here',
      callback: handleGoogleResponse,
      auto_select: false,
      cancel_on_tap_outside: true
    })
  }
  
  const handleGoogleResponse = async (response: any) => {
    if (!response.credential) {
      onError?.('No credential received from Google')
      return
    }
    
    setIsLoading(true)
    
    try {
      // Send the ID token to our backend for verification
      const result = await fetch(`${API_BASE_URL}/auth/google/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: response.credential
        })
      })
      
      const data: GoogleAuthResponse = await result.json()
      
      if (!result.ok) {
        throw new Error(data.message || 'Authentication failed')
      }
      
      if (data.success && data.user && data.access_token && data.refresh_token) {
        // Store tokens in localStorage
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('refresh_token', data.refresh_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token_type', data.token_type || 'bearer')
        localStorage.setItem('expires_in', String(data.expires_in || 1800))
        
        // Call success callback
        onSuccess?.(data.user, {
          access_token: data.access_token,
          refresh_token: data.refresh_token
        })
        
        // Navigate to appropriate page based on role
        if (redirectTo) {
          navigate(redirectTo)
        } else {
          navigateByRole(data.user.role)
        }
      } else {
        throw new Error('Invalid response from server')
      }
      
    } catch (error) {
      console.error('Google authentication error:', error)
      onError?.(error instanceof Error ? error.message : 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleServerSideAuth = () => {
    const redirectUrl = redirectTo || window.location.origin + '/dashboard'
    window.location.href = `${API_BASE_URL}/auth/google/login?redirect_url=${encodeURIComponent(redirectUrl)}`
  }
  
  const handleClientSideAuth = () => {
    if (!window.google) {
      onError?.('Google authentication not loaded')
      return
    }
    
    // Trigger the Google Sign-In prompt
    window.google.accounts.id.prompt()
  }
  
  const navigateByRole = (role: string) => {
    switch (role) {
      case 'admin':
      case 'manager':
        navigate('/dashboard')
        break
      case 'waiter':
        navigate('/waiter')
        break
      case 'kitchen':
        navigate('/kitchen')
        break
      case 'cashier':
        navigate('/pos')
        break
      default:
        navigate('/dashboard')
    }
  }
  
  return (
    <div className={`google-auth-container ${className}`}>
      {/* Client-side Google Sign-In Button */}
      <div className="space-y-4">
        <button
          onClick={handleClientSideAuth}
          disabled={isLoading || !isGoogleLoaded}
          className={`
            w-full flex items-center justify-center px-6 py-3 border border-gray-300 
            rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900 mr-3"></div>
          ) : (
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {isLoading ? 'Signing in...' : buttonText}
        </button>
        
        {/* Server-side option */}
        {showServerSideOption && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>
        )}
        
        {showServerSideOption && (
          <button
            onClick={handleServerSideAuth}
            disabled={isLoading}
            className={`
              w-full flex items-center justify-center px-6 py-3 border-2 border-blue-600
              rounded-lg shadow-sm bg-blue-600 text-white hover:bg-blue-700 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            `}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in via Google (Server)
          </button>
        )}
      </div>
      
      {/* Status indicators */}
      <div className="mt-4 text-sm text-gray-500">
        {!isGoogleLoaded && (
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            Loading Google authentication...
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for managing authentication state
export const useGoogleAuth = () => {
  const [user, setUser] = useState<GoogleUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    // Check for existing authentication
    const storedUser = localStorage.getItem('user')
    const storedToken = localStorage.getItem('access_token')
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser)
        setUser(userData)
        setIsAuthenticated(true)
      } catch (error) {
        // Clear invalid data
        localStorage.removeItem('user')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      }
    }
    
    setIsLoading(false)
  }, [])
  
  const logout = async () => {
    setIsLoading(true)
    
    try {
      // Call logout endpoint
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://172.29.228.80:9002'
      await fetch(`${API_BASE_URL}/auth/google/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('token_type')
      localStorage.removeItem('expires_in')
      
      setUser(null)
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }
  
  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token')
    const tokenType = localStorage.getItem('token_type') || 'bearer'
    
    if (token) {
      return {
        'Authorization': `${tokenType} ${token}`
      }
    }
    
    return {}
  }
  
  return {
    user,
    isAuthenticated,
    isLoading,
    logout,
    getAuthHeaders
  }
}

export default GoogleAuth