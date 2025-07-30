# Google OAuth Setup Guide for BlueBank

## Overview
This guide will help you set up Google OAuth authentication for your BlueBank application. Users will be able to register and login using their Google accounts.

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (if not already enabled)

## Step 2: Configure OAuth Consent Screen

1. In Google Cloud Console, go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - App name: "BlueBank"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `openid`
   - `email`
   - `profile`
5. Add test users (your email addresses for testing)

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Set the following:
   - Name: "BlueBank Web Client"
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000`
5. Copy the Client ID (you'll need this)

## Step 4: Update Your Application

1. **Replace the Client ID in your frontend files:**
   - Open `frontend/app/login/page.tsx`
   - Find `'YOUR_GOOGLE_CLIENT_ID'` and replace it with your actual Client ID
   - Open `frontend/app/register/page.tsx`
   - Find `'YOUR_GOOGLE_CLIENT_ID'` and replace it with your actual Client ID

2. **Restart your backend server** to ensure the new database schema is applied.

## Step 5: Test the Integration

1. Start your backend server: `cd backend && python main.py`
2. Start your frontend: `cd frontend && npm run dev`
3. Go to `http://localhost:3000/login` or `http://localhost:3000/register`
4. You should see Google login buttons
5. Click the Google button to test the authentication

## How It Works

### Backend Changes:
- Added `google_id` and `auth_provider` columns to the users table
- Created `/google-auth` endpoint to handle Google authentication
- Updated authentication logic to support Google users
- Google users get a special password (`google_auth`) for internal use

### Frontend Changes:
- Added Google Identity Services script loading
- Added Google login buttons to both login and register pages
- Integrated Google authentication with existing session management

### User Flow:
1. User clicks "Sign in with Google" or "Sign up with Google"
2. Google OAuth popup appears
3. User authorizes the application
4. Google sends user info to your backend
5. Backend creates/updates user account
6. User is logged in and redirected to balance page

## Security Notes

- Google users don't have traditional passwords stored
- The `google_auth` password is only used internally
- Google tokens are verified with Google's servers
- User data is securely stored in your database

## Troubleshooting

### Common Issues:

1. **"Invalid Client ID" error:**
   - Make sure you replaced `YOUR_GOOGLE_CLIENT_ID` with your actual Client ID
   - Ensure the Client ID is for a Web application, not other types

2. **"Redirect URI mismatch" error:**
   - Add `http://localhost:3000` to authorized redirect URIs in Google Cloud Console
   - Make sure there are no trailing slashes

3. **Database errors:**
   - Delete the `bank_users.db` file and restart the backend to recreate the database with the new schema

4. **CORS errors:**
   - Ensure your backend CORS settings include `http://localhost:3000`

### Testing:
- Use different Google accounts to test registration
- Try logging in with an existing Google account
- Test the regular email/password registration alongside Google OAuth

## Production Deployment

For production, you'll need to:
1. Update authorized origins to your production domain
2. Use environment variables for the Client ID
3. Set up proper HTTPS
4. Configure production database
5. Update CORS settings for your production domain

## Files Modified

### Backend:
- `main.py`: Added Google OAuth endpoints and database schema
- `Api_Key.env`: No changes needed for Google OAuth

### Frontend:
- `login/page.tsx`: Added Google login button and authentication
- `register/page.tsx`: Added Google signup button and authentication

The Google OAuth integration is now ready to use! 🎉 