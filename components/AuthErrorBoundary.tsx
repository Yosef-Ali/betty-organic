'use client';

import { useEffect, useState, ReactNode } from 'react';
import { refreshAuthToken } from '@/app/actions/refresh-auth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';

interface AuthErrorBoundaryProps {
  children: ReactNode;
}

export function AuthErrorBoundary({ children }: AuthErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);
  const [refreshAttempts, setRefreshAttempts] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Listen for auth errors and attempt to recover
  useEffect(() => {
    const handleAuthError = async (event: PromiseRejectionEvent) => {
      // Filter out Event objects that are accidentally thrown as errors
      if (event.reason instanceof Event) {
        console.warn('Event object thrown as error, ignoring:', event.reason.type);
        event.preventDefault();
        return;
      }

      const errorMessage = event.reason?.message || '';

      // Only intercept authentication related errors
      if (errorMessage.includes('Authentication') ||
        errorMessage.includes('auth') ||
        errorMessage.includes('unauthorized') ||
        errorMessage.includes('token')) {

        // Prevent default error handling
        event.preventDefault();

        // Only try 3 times
        if (refreshAttempts < 3) {
          try {
            setIsRefreshing(true);
            setRefreshAttempts(prev => prev + 1);
            const result = await refreshAuthToken();

            if (result.success) {
              // Reset error if successful
              setError(null);
              console.log('Authentication refreshed successfully');

              // Force reload if needed
              if (refreshAttempts >= 2) {
                window.location.reload();
              }
            } else {
              setError(new Error(result.error || 'Failed to refresh authentication'));
            }
          } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown authentication error'));
          } finally {
            setIsRefreshing(false);
          }
        } else {
          setError(new Error('Authentication failed after multiple attempts'));
        }
      }
    };

    window.addEventListener('unhandledrejection', handleAuthError);
    return () => window.removeEventListener('unhandledrejection', handleAuthError);
  }, [refreshAttempts]);

  const handleRetry = async () => {
    try {
      setIsRefreshing(true);
      const result = await refreshAuthToken();

      if (result.success) {
        setError(null);
        // Force page reload to refresh all components with new auth state
        window.location.reload();
      } else {
        setError(new Error(result.error || 'Failed to refresh authentication'));
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Authentication refresh failed'));
    } finally {
      setIsRefreshing(false);
    }
  };

  if (error) {
    return (
      <Alert variant="destructive" className="my-4">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Authentication Error</AlertTitle>
        <AlertDescription>
          <p className="mb-2">{error.message}</p>
          <Button
            variant="outline"
            onClick={handleRetry}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Retry Authentication'}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
}
