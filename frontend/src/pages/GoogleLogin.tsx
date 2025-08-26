/**
 * Google OAuth login page for restaurant management system.
 * Provides a complete login interface with Google authentication.
 */

import React, { useState } from 'react'
import { API_BASE_URL, API_ENDPOINTS } from '../config/api';
import { Navigate } from 'react-router-dom'
import GoogleAuth, { useGoogleAuth } from '../components/GoogleAuth'
import { toast } from 'react-hot-toast'

interface GoogleUser {
  id: number
  email: string
  first_name: string
  last_name: string
  role: string
  is_active: boolean
}

const GoogleLogin: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useGoogleAuth()
  const [isLoading, setIsLoading] = useState(false)
  
  // Redirect if already authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }
  
  const handleGoogleSuccess = (user: GoogleUser, tokens: any) => {
    setIsLoading(false)
    toast.success(`Welcome ${user.first_name}! Signed in successfully.`)
    
    // Navigation is handled by the GoogleAuth component
    console.log('User authenticated:', user)
    console.log('Tokens received:', { ...tokens, access_token: '***', refresh_token: '***' })
  }
  
  const handleGoogleError = (error: string) => {
    setIsLoading(false)
    toast.error(`Authentication failed: ${error}`)
    console.error('Google auth error:', error)
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white font-bold">🍽️</span>
          </div>
        </div>
        
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Restaurant Management System
        </h2>
        
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in with your Google account to access the system
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Google Authentication Component */}
          <GoogleAuth
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            buttonText="Sign in with Google"
            showServerSideOption={true}
            className="w-full"
          />
          
          {/* Role Information */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              System Roles:
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
              <div className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                <span className="font-medium">Admin:</span>
                <span className="ml-1">Full system access</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                <span className="font-medium">Manager:</span>
                <span className="ml-1">Operations & reports</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <span className="font-medium">Waiter:</span>
                <span className="ml-1">Table & order management</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <span className="font-medium">Kitchen:</span>
                <span className="ml-1">Order preparation</span>
              </div>
              <div className="flex items-center">
                <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                <span className="font-medium">Cashier:</span>
                <span className="ml-1">Payment processing</span>
              </div>
            </div>
          </div>
          
          {/* Security Notice */}
          <div className="mt-6 p-3 bg-blue-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Secure Authentication
                </h3>
                <div className="mt-1 text-sm text-blue-700">
                  <p>
                    Your Google account credentials are handled securely. 
                    We never store your Google password.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Support Info */}
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>
              Need access? Contact your system administrator.
            </p>
            <p className="mt-1">
              Having trouble? Check your internet connection and try again.
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-400">
        <p>© 2025 Restaurant Management System. All rights reserved.</p>
      </div>
    </div>
  )
}

export default GoogleLogin