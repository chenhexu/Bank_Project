# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for BlueBank.

## Prerequisites

You need a Google account and access to the Google Cloud Console.

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on "Select a project" at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "BlueBank OAuth")
5. Click "Create"

## Step 2: Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google+ API"
3. Click on it and then click "Enable"

## Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" for user type (unless you have a Google Workspace account)
3. Click "Create"
4. Fill in the required information:
   - **App name**: BlueBank
   - **User support email**: Your email
   - **Developer contact information**: Your email
5. Click "Save and Continue"
6. Skip "Scopes" by clicking "Save and Continue"
7. Add test users (your email addresses) if needed
8. Click "Save and Continue"

## Step 4: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application" as the application type
4. Give it a name (e.g., "BlueBank Web Client")
5. Add authorized JavaScript origins:
   - For local development: `http://localhost:8080`
   - For production: `https://bluebank.unifra.org`
6. Add authorized redirect URIs:
   - For local development: `http://localhost:8080/auth/google/callback`
   - For production: `https://bluebank.unifra.org/auth/google/callback`
7. Click "Create"

## Step 5: Get Your Credentials

After creating the OAuth client, you'll see a dialog with:
- **Client ID**: A long string ending in `.apps.googleusercontent.com`
- **Client Secret**: A shorter secret string

Copy these values - you'll need them for the next step.

## Step 6: Configure Environment Variables

1. Copy the `backend/env.template` file to `backend/.env`
2. Update the Google OAuth configuration:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID="your_client_id_here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_client_secret_here"
GOOGLE_REDIRECT_URI="http://localhost:8080/auth/google/callback"
```

For production deployment, use your production domain:
```env
GOOGLE_REDIRECT_URI="https://bluebank.unifra.org/auth/google/callback"
```

## Step 7: Test the Integration

1. Restart your BlueBank application
2. Go to the login page
3. Click "Sign in with Google"
4. You should see the Google sign-in popup
5. Sign in with your Google account
6. You should be redirected back to BlueBank and logged in

## Troubleshooting

### Common Issues

**"OAuth client not found" error**
- Make sure your `GOOGLE_CLIENT_ID` is correct
- Verify the client ID exists in Google Cloud Console

**"Redirect URI mismatch" error**
- Check that your redirect URIs in Google Cloud Console match your `GOOGLE_REDIRECT_URI`
- Make sure you're accessing the site from the correct domain

**"This app isn't verified" warning**
- This is normal for development - click "Advanced" > "Go to BlueBank (unsafe)"
- For production, you can submit your app for verification

**Google button doesn't appear**
- Check browser console for JavaScript errors
- Verify your Client ID is correctly configured
- Make sure you're not blocking third-party cookies

### Security Notes

- Never commit your Google Client Secret to version control
- Use different OAuth clients for development and production
- Regularly rotate your client secrets
- Monitor your OAuth usage in Google Cloud Console

## Production Deployment

For production deployment on `bluebank.unifra.org`:

1. Add the production domain to your OAuth configuration in Google Cloud Console
2. Update your environment variables with the production redirect URI
3. Ensure your SSL certificate is properly configured
4. Test the OAuth flow thoroughly

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In for Websites](https://developers.google.com/identity/sign-in/web)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)