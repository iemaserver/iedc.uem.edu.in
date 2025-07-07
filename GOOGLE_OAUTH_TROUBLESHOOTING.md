# Google OAuth Troubleshooting Guide

## Common Issues and Solutions

### 1. Redirect URI Mismatch
**Error:** `redirect_uri_mismatch`
**Solution:** Ensure your Google OAuth app is configured with the correct redirect URI:
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Navigate to "APIs & Services" > "Credentials"
- Click on your OAuth 2.0 Client ID
- Add this URI to "Authorized redirect URIs": `http://localhost:3000/api/auth/callback/google`
- For production, use: `https://yourdomain.com/api/auth/callback/google`

### 2. OAuth Consent Screen Issues
**Error:** `access_denied` or consent screen errors
**Solution:** Configure the OAuth consent screen:
- Go to "APIs & Services" > "OAuth consent screen"
- Choose "External" for user type (unless you're on Google Workspace)
- Fill out required fields (App name, User support email, Developer contact)
- Add test users if the app is in testing mode
- Consider publishing the app if you need external users

### 3. Invalid Client Configuration
**Error:** `invalid_client`
**Solution:** Check your environment variables:
- Ensure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correctly set
- Verify the credentials match your Google Cloud Console OAuth app

### 4. HTTPS Requirements
**Error:** Various SSL/HTTPS errors
**Solution:** 
- For development: Use `http://localhost:3000` (Google allows this)
- For production: Always use HTTPS
- Ensure `NEXTAUTH_URL` matches your domain protocol

## Environment Variables Check
```
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

## Testing Steps
1. Visit `/test-google-auth` to test the Google OAuth flow
2. Check browser console for JavaScript errors
3. Check server logs for authentication errors
4. Verify Google Cloud Console configuration

## Debug Mode
The app is currently running in debug mode. Check the server logs for detailed authentication information.
