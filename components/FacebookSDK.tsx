'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export function FacebookSDK() {
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.fbAsyncInit = () => {
      try {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
          xfbml: true,
          version: 'v18.0',
          autoLogAppEvents: true
        });

        // Subscribe to events
        window.FB.Event.subscribe('xfbml.render', () => {
          console.log('Facebook XFBML rendered');
          setSdkLoaded(true);
        });

        window.FB.Event.subscribe('auth.statusChange', (response: any) => {
          console.log('Facebook auth status:', response.status);
        });

        // Initial XFBML parse
        window.FB.XFBML.parse();
      } catch (err) {
        console.error('Facebook SDK initialization error:', err);
        setError('Failed to initialize Facebook SDK');
      }
    };

    // Parse XFBML when SDK is reloaded
    if (typeof window !== 'undefined' && window.FB) {
      try {
        // Check if FB object is fully initialized
        if (window.FB.XFBML) {
          window.FB.XFBML.parse();
          setSdkLoaded(true);
        }
      } catch (err) {
        console.error('XFBML parse error:', err);
        setError('Failed to parse Facebook elements');
      }
    }

    return () => {
      // Cleanup
      if (window.FB) {
        try {
          window.FB.XFBML.parse(); // Re-parse in case content changed
        } catch (err) {
          console.error('XFBML cleanup error:', err);
        }
      }
    };
  }, []);

  return (
    <>
      <div id="fb-root"></div>
      <Script
        src="https://connect.facebook.net/en_US/sdk.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Facebook SDK loaded');
        }}
        onError={(e) => {
          console.error('Facebook SDK failed to load:', e);
          setError('Failed to load Facebook SDK');
        }}
      />
      {error && (
        <div style={{ display: 'none' }} role="alert" aria-label="Facebook SDK Error">
          {error}
        </div>
      )}
    </>
  );
}
