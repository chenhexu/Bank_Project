# 📘 Facebook OAuth Setup Guide for BlueBank

## 📋 Overview
This guide explains how to set up Facebook OAuth authentication for BlueBank using Meta for Developers (Facebook for Developers).

## 🎯 Prerequisites
- Meta for Developers account
- BlueBank application deployed and accessible
- Facebook App created (already done: **BlueBank** - App ID: `1429308784784365`)

---

## 🚀 Step 1: Facebook App Configuration (Already Completed)

### ✅ App Details
- **App Name**: BlueBank
- **App ID**: `1429308784784365`
- **Mode**: Development (ready for production)

### ✅ Facebook Login Configuration
Your app already has:
- Facebook Login use case enabled
- Required permissions configured:
  - `email` - Access to user's email address
  - `public_profile` - Access to user's basic profile info

---

## 🔧 Step 2: Get Facebook App Secret

### Navigate to App Settings
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your **BlueBank** app
3. Go to **Settings** > **Basic**
4. Copy the **App Secret** (you'll need this for environment variables)

⚠️ **Security Note**: Never expose your App Secret in client-side code!

---

## 🌐 Step 3: Configure Valid OAuth Redirect URIs

### In Meta for Developers Console:
1. Go to your **BlueBank** app dashboard
2. Navigate to **Facebook Login** > **Settings**
3. Add these **Valid OAuth Redirect URIs**:

```
# Development
http://localhost:3000/auth/facebook/callback
http://localhost:8080/auth/facebook/callback

# Production
https://bluebank.unifra.org/auth/facebook/callback
```

### Add App Domains:
In **Settings** > **Basic**, add:
```
localhost
bluebank.unifra.org
```

---

## 🔑 Step 4: Environment Variables Configuration

### Update `backend/.env`
Add these Facebook OAuth variables:

```env
# Facebook OAuth Configuration
FACEBOOK_APP_ID=1429308784784365
FACEBOOK_APP_SECRET=your_facebook_app_secret_here
FACEBOOK_REDIRECT_URI=https://bluebank.unifra.org/auth/facebook/callback
```

### For Different Environments:

#### Development
```env
FACEBOOK_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
```

#### Docker
```env
FACEBOOK_REDIRECT_URI=http://localhost:8080/auth/facebook/callback
```

#### Production
```env
FACEBOOK_REDIRECT_URI=https://bluebank.unifra.org/auth/facebook/callback
```

---

## 🔒 Step 5: Facebook App Permissions

### Required Permissions (Already Configured):
- ✅ **email** - To get user's email for account creation
- ✅ **public_profile** - To get user's name and profile picture

### Permission Status:
- **email**: Ready for testing (17 API calls available)
- **public_profile**: Ready for testing (25 API calls available)

---

## 🚀 Step 6: App Review & Publishing

### Current Status:
- ✅ **Facebook Login use case**: Customized
- ⏳ **Testing requirements**: Complete testing
- ⏳ **Business verification**: Submit if required
- ⏳ **App Review**: Submit for review
- ⏳ **Publishing**: Ready to publish

### For Production Deployment:
1. **Complete App Review**: Submit your app for Facebook review
2. **Business Verification**: May be required for certain permissions
3. **Switch to Live Mode**: Change from Development to Live mode

---

## 🔧 Step 7: Technical Implementation Overview

### Backend Endpoints (Already Implemented):
```python
# Get Facebook OAuth configuration
GET /api/auth/facebook/config

# Authenticate with Facebook
POST /api/auth/facebook
{
  "access_token": "facebook_access_token"
}
```

### Frontend Integration (Already Implemented):
```typescript
// Facebook OAuth Hook
const { isFacebookReady, isLoading, signInWithFacebook } = useFacebookAuth();

// Login/Register Flow
const result = await signInWithFacebook();
```

### Facebook SDK Integration:
- SDK Version: `v18.0`
- Permissions: `email,public_profile`
- Response Type: Access Token

---

## 🧪 Step 8: Testing Instructions

### Local Testing:
1. Start backend: `uvicorn main:app --reload`
2. Start frontend: `npm run dev`
3. Navigate to: `http://localhost:3000/login`
4. Click "Sign in with Facebook"

### Production Testing:
1. Navigate to: `https://bluebank.unifra.org/login`
2. Click "Sign in with Facebook"
3. Authorize with your Facebook account
4. Should redirect to balance page

### Test User Accounts:
- Use your personal Facebook account for testing
- Add test users in Meta for Developers if needed

---

## 🔍 Step 9: Troubleshooting

### Common Issues:

#### 1. "App Not Set Up for Facebook Login"
- **Solution**: Ensure Facebook Login is added to your app use cases
- **Check**: Valid OAuth Redirect URIs are correctly configured

#### 2. "Invalid OAuth Access Token"
- **Solution**: Verify App ID matches in environment variables
- **Check**: App Secret is correctly set and not exposed

#### 3. "Permission Denied for Email"
- **Solution**: User must grant email permission during login
- **Check**: Email permission is requested in scope

#### 4. "App is in Development Mode"
- **Solution**: For public access, submit app for review
- **Check**: Add test users or switch to live mode

### Debug Steps:
1. Check browser console for errors
2. Verify backend logs for Facebook API responses
3. Test API endpoints directly with Postman
4. Confirm environment variables are loaded

---

## 📊 Step 10: Monitoring & Analytics

### Facebook Analytics:
- Monitor login attempts in Meta for Developers
- Track API usage and quotas
- Review app performance metrics

### Application Logs:
- Backend logs Facebook OAuth steps
- Frontend console shows OAuth flow progress
- Database tracks user creation from Facebook

---

## 🎯 Facebook OAuth Flow Summary

```
1. User clicks "Sign in with Facebook" ✅
2. Facebook SDK opens login popup ✅
3. User authorizes BlueBank app ✅
4. Facebook returns access token to frontend ✅
5. Frontend sends token to backend /api/auth/facebook ✅
6. Backend verifies token with Facebook Graph API ✅
7. Backend extracts user profile (email, name) ✅
8. Backend creates/retrieves user in database ✅
9. Backend returns user profile to frontend ✅
10. Frontend stores session and redirects to dashboard ✅
```

---

## 📞 Support & Additional Resources

### Meta for Developers Documentation:
- [Facebook Login Guide](https://developers.facebook.com/docs/facebook-login/)
- [Graph API Reference](https://developers.facebook.com/docs/graph-api/)
- [App Review Process](https://developers.facebook.com/docs/app-review/)

### BlueBank Implementation:
- Backend: `backend/main.py` (Facebook OAuth endpoints)
- Frontend: `frontend/hooks/useFacebookAuth.ts`
- Login: `frontend/app/login/page.tsx`
- Register: `frontend/app/register/page.tsx`

---

**🎉 Facebook OAuth is now fully integrated with BlueBank!**

*Last Updated: August 19, 2025*