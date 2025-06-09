'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function OAuthHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check if we have an OAuth code in the URL parameters
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    
    if (code) {
      console.log('OAuth code detected on home page, redirecting to callback...');
      
      // Build the callback URL with all parameters
      const callbackUrl = new URL('/auth/callback', window.location.origin);
      callbackUrl.searchParams.set('code', code);
      
      if (state) {
        callbackUrl.searchParams.set('state', state);
      }
      
      // Redirect to the proper auth callback route
      window.location.href = callbackUrl.toString();
    }
  }, [searchParams, router]);

  // This component doesn't render anything visible
  return null;
}