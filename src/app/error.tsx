'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application Error:', error);
    
    // Show toast notification
    toast.error('An unexpected error occurred');
  }, [error]);

  const handleRetry = () => {
    try {
      reset();
      toast.success('Attempting to recover...');
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      toast.error('Failed to recover. Please refresh the page.');
    }
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  const handleGoBack = () => {
    router.back();
  };

  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
            We encountered an unexpected error while processing your request.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Details for Development */}
          {isDevelopment && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                Development Error Details:
              </h3>
              <div className="text-sm">
                <p className="font-mono text-red-700 dark:text-red-300 break-all">
                  {error.message}
                </p>
                {error.digest && (
                  <p className="text-red-600 dark:text-red-400 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Error Information for Production */}
          {!isDevelopment && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                What happened?
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                An unexpected error occurred while processing your request. Our team has been notified and is working to resolve the issue.
              </p>
              {error.digest && (
                <p className="text-blue-600 dark:text-blue-400 mt-2 text-sm">
                  Reference ID: {error.digest}
                </p>
              )}
            </div>
          )}

          {/* Suggested Actions */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              What you can do:
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Try refreshing the page</li>
              <li>• Check your internet connection</li>
              <li>• Go back to the previous page</li>
              <li>• Contact support if the problem persists</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleRetry} 
              className="flex items-center gap-2 flex-1"
              variant="default"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              onClick={handleGoBack} 
              variant="outline"
              className="flex items-center gap-2 flex-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            
            <Button 
              onClick={handleGoHome} 
              variant="outline"
              className="flex items-center gap-2 flex-1"
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Button>
          </div>

          {/* Additional Help */}
          <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Still having trouble?{' '}
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
