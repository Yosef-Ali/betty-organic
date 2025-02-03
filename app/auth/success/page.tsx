'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message === 'email_verified') {
      toast.success('Email verified successfully!');
    }
    // Redirect to home page after 2 seconds
    const timeout = setTimeout(() => {
      router.push('/');
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Verification Successful!</h1>
        <p>Redirecting to home page...</p>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Loading...</h1>
            <p>Please wait while we process your request.</p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
