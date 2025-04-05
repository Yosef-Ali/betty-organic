'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Dynamically import the client-side implementation
const ClientNotificationDebugPage = dynamic(() => import('./page.client'), {
  ssr: false,
});

// Fallback loading component
function LoadingFallback() {
  return (
    <div className="container py-10 flex justify-center items-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function NotificationDebugPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ClientNotificationDebugPage />
    </Suspense>
  );
}
