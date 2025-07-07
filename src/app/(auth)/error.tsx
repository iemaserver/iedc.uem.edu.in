'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AuthErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthError({ error, reset }: AuthErrorProps) {
  const router = useRouter();

  useEffect(() => {
    console.error('Auth Layout Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
            Something went wrong with the authentication process.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-700 dark:text-red-300">
              An error occurred while processing your authentication request. Please try again.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-2 font-mono">
                {error.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              onClick={reset} 
              className="w-full"
            >
              Try Again
            </Button>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => router.back()} 
                variant="outline"
                className="flex items-center gap-2 flex-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </Button>
              
              <Button 
                onClick={() => router.push('/')} 
                variant="outline"
                className="flex items-center gap-2 flex-1"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </div>
          </div>

          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Need help?{' '}
              <a 
                href="mailto:support@iedc.com" 
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline"
              >
                Contact Support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
