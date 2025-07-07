import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/callback/google`;
  
  return NextResponse.json({
    message: 'Google OAuth Configuration Test',
    config: {
      clientId: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
      redirectUri,
      nextAuthUrl: process.env.NEXTAUTH_URL,
    },
    instructions: [
      'Make sure your Google OAuth app is configured with the following redirect URI:',
      redirectUri,
      'You can configure this in the Google Cloud Console under APIs & Services > Credentials > OAuth 2.0 Client IDs'
    ]
  });
}
