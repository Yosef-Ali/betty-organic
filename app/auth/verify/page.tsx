'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { verifyEmail } from '@/app/actions/auth';

function VerifyEmailContent() {
  const [verificationStatus, setVerificationStatus] = useState<{
    success?: boolean;
    message?: string;
    error?: string;
  }>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const email = searchParams.get('email');

  useEffect(() => {
    async function verify() {
      if (!code || !email) {
        setVerificationStatus({
          success: false,
          error: 'Invalid verification link',
        });
        return;
      }

      const result = await verifyEmail(email, code);

      if (result.error) {
        setVerificationStatus({
          success: false,
          error: result.error,
        });
      } else {
        setVerificationStatus({
          success: true,
          message: result.message,
        });
        // Redirect to login page after successful verification
        setTimeout(() => {
          router.push('/auth/login');
        }, 3000);
      }
    }

    verify();
  }, [code, email, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Email Verification
          </h2>
        </div>
        <div className="mt-8 text-center">
          {verificationStatus.error ? (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                {verificationStatus.error}
              </div>
            </div>
          ) : verificationStatus.success ? (
            <div className="rounded-md bg-green-50 p-4">
              <div className="text-sm text-green-700">
                {verificationStatus.message}
                <p className="mt-2">Redirecting to login page...</p>
              </div>
            </div>
          ) : (
            <div className="text-gray-600">Verifying your email...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
