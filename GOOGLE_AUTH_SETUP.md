# 🔐 Google OAuth Setup Guide

Complete setup instructions for Google authentication in your restaurant management system.

---

## 🎯 Overview

Google OAuth has been integrated into your restaurant system with both **server-side** and **client-side** authentication options:

- ✅ **Database Configuration**: Updated to use 'coomlook' database
- ✅ **Backend API**: Google OAuth endpoints created
- ✅ **Frontend Components**: React Google Auth components ready
- ✅ **Security**: JWT token management with role-based access

---

## 📋 Prerequisites

1. **Google Cloud Console Access**: You need a Google account with access to create projects
2. **Domain/IP**: Your app runs on `http://172.29.228.80:9002` (backend) and `http://172.29.228.80:5173` (frontend)
3. **SSL Certificate** (Recommended for production): Google OAuth works better with HTTPS

---

## 🚀 Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Create New Project**:
   - Click "Select a project" → "New Project"
   - Project name: `Restaurant Management System`
   - Click "Create"

3. **Enable Google+ API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google+ API" or "Google Identity"
   - Click "Enable"

---

## 🔑 Step 2: Create OAuth 2.0 Credentials

1. **Go to Credentials**:
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"

2. **Configure OAuth Consent Screen** (if first time):
   - Click "Configure Consent Screen"
   - Choose "External" (unless you have a Google Workspace)
   - Fill required fields:
     - App name: `Restaurant Management System`
     - User support email: Your email
     - Developer contact: Your email
   - Save and continue through the steps

3. **Create OAuth 2.0 Client ID**:
   - Application type: **Web application**
   - Name: `Restaurant Management System`
   - **Authorized JavaScript origins**:
     ```
     http://172.29.228.80:5173
     http://localhost:5173
     http://172.29.228.80:9002
     http://localhost:9002
     ```
   - **Authorized redirect URIs**:
     ```
     http://172.29.228.80:9002/auth/google/callback
     http://localhost:9002/auth/google/callback
     ```

4. **Save Credentials**:
   - Copy the **Client ID** and **Client Secret**
   - Keep these secure!

---

## 📝 Step 3: Update Configuration Files

### Backend Configuration

Update `/backend/.env` with your Google credentials:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
GOOGLE_REDIRECT_URI=http://172.29.228.80:9002/auth/google/callback
```

### Frontend Configuration

Create `/frontend/.env` with:

```env
VITE_API_URL=http://172.29.228.80:9002
VITE_GOOGLE_CLIENT_ID=your_actual_google_client_id_here
```

---

## 🛠️ Step 4: Install Dependencies

### Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Frontend Dependencies (if needed)

```bash
cd frontend
npm install
```

---

## 🚀 Step 5: Start the Services

### Start Backend Server

```bash
cd backend
python3 complete_server.py
```

The server should start on `http://172.29.228.80:9002`

### Start Frontend (in another terminal)

```bash
cd frontend
npm run dev
```

The frontend should start on `http://172.29.228.80:5173`

---

## 🧪 Step 6: Test Google Authentication

### Test Backend Endpoints

1. **Check Google Auth Status**:
   ```bash
   curl http://172.29.228.80:9002/auth/google/status
   ```
   
   Should return:
   ```json
   {
     "google_auth_configured": true,
     "client_id_set": true,
     "client_secret_set": true,
     "redirect_uri": "http://172.29.228.80:9002/auth/google/callback",
     "service_available": true
   }
   ```

2. **Test Login Redirect**:
   Open in browser: `http://172.29.228.80:9002/auth/google/login`
   
   Should redirect to Google's OAuth page.

### Test Frontend

1. **Open Login Page**: `http://172.29.228.80:5173/login` (if you have routing set up)
2. **Click Google Sign-In**: Should show Google authentication popup
3. **Complete Login**: Should redirect to appropriate dashboard based on role

---

## 🔧 Integration with Existing System

### Update Your React Routes

Add the Google login page to your routing:

```tsx
// In your App.tsx or router configuration
import GoogleLogin from './pages/GoogleLogin'

<Route path="/login" element={<GoogleLogin />} />
<Route path="/google-auth" element={<GoogleLogin />} />
```

### Protect Routes with Authentication

Use the `useGoogleAuth` hook to protect routes:

```tsx
import { useGoogleAuth } from '../components/GoogleAuth'

const ProtectedComponent = () => {
  const { isAuthenticated, user, isLoading } = useGoogleAuth()
  
  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <Navigate to="/login" />
  
  return <div>Welcome {user?.first_name}!</div>
}
```

### Update API Calls

Use the authentication headers:

```tsx
const { getAuthHeaders } = useGoogleAuth()

const apiCall = async () => {
  const response = await fetch('/api/endpoint', {
    headers: {
      ...getAuthHeaders(),
      'Content-Type': 'application/json'
    }
  })
}
```

---

## 🎭 User Role Management

### Default User Roles

New users signing in with Google get the **"waiter"** role by default. Admins can change roles through the user management interface.

### Role-Based Redirects

After Google authentication, users are redirected based on their role:

- **Admin/Manager** → `/dashboard`
- **Waiter** → `/waiter`
- **Kitchen** → `/kitchen`
- **Cashier** → `/pos`

---

## 🔒 Security Features

### CSRF Protection

- State parameter validation
- Session-based security
- Token verification

### JWT Management

- Access tokens (30 minutes expiry)
- Refresh tokens (7 days expiry)
- Secure token storage

### API Security

- Role-based endpoint protection
- Token validation middleware
- User session management

---

## 🐛 Troubleshooting

### Common Issues

1. **"Client ID not set" error**:
   - Check that `GOOGLE_CLIENT_ID` is in your `.env` files
   - Restart both backend and frontend

2. **"Redirect URI mismatch" error**:
   - Verify the redirect URI in Google Console matches exactly
   - Check for trailing slashes

3. **"Access blocked" error**:
   - Ensure OAuth consent screen is configured
   - Add your email to test users if app is in testing mode

4. **Database connection issues**:
   - Verify the database name is "coomlook" in all config files
   - Check MySQL connection credentials

### Debug Mode

Enable debug logging in backend:

```env
DEBUG=true
```

Check backend logs in `/backend/logs/` directory.

---

## 📱 Mobile/Tablet Optimization

The Google Auth components are optimized for tablet use with:

- Touch-friendly buttons (44px minimum)
- Responsive design
- Mobile-first approach
- PWA compatibility

---

## 🚀 Production Deployment

### For Production

1. **Use HTTPS**: Update redirect URIs to use `https://`
2. **Secure Secrets**: Use proper secret management
3. **Verify Domain**: Add your production domain to Google Console
4. **OAuth Consent**: Submit for verification if needed

### Environment Variables

```env
# Production
GOOGLE_CLIENT_ID=prod_client_id
GOOGLE_CLIENT_SECRET=prod_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback
```

---

## ✅ Testing Checklist

- [ ] Google Cloud project created
- [ ] OAuth credentials configured
- [ ] Backend `.env` updated
- [ ] Frontend `.env` created
- [ ] Backend server starts without errors
- [ ] Frontend builds successfully
- [ ] Google auth status endpoint returns success
- [ ] Google login redirects to Google
- [ ] User can complete authentication
- [ ] JWT tokens are generated
- [ ] Role-based navigation works
- [ ] API calls include auth headers
- [ ] User can logout successfully

---

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review browser console for JavaScript errors
3. Check backend logs in `/backend/logs/`
4. Verify all environment variables are set correctly

**Your Google OAuth integration is now complete and ready for testing!** 🎉