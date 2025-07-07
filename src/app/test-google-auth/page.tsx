"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

export default function GoogleAuthTest() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: false 
      });
      
      if (result?.error) {
        setError(result.error);
      }
    } catch (err) {
      setError("An error occurred during sign in");
      console.error("Sign in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Google Auth Test</h1>
      
      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>
      
      {session ? (
        <div>
          <div className="mb-4">
            <strong>Signed in as:</strong> {session.user?.email}
          </div>
          <div className="mb-4">
            <strong>User Type:</strong> {session.user?.userType}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mb-4 disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign In with Google"}
          </button>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>
      )}
      
      <div className="mt-6 text-sm text-gray-600">
        <p><strong>Expected Google OAuth Redirect URI:</strong></p>
        <p className="break-all">http://localhost:3000/api/auth/callback/google</p>
      </div>
    </div>
  );
}
