'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';

export default function ConfirmRedirectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        if (token_hash && type === 'signup') {
          const { error } = await supabase.auth.verifyOtp({
            token_hash,
            type: 'signup'
          });

          if (error) throw error;

          // Show success message
          toast.success('Email verified successfully!');
          
          // Get user data after verification
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Create or update profile
            await supabase.from('profiles').upsert({
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.email?.split('@')[0],
              role: 'customer',
              status: 'active',
              auth_provider: 'email',
              updated_at: new Date().toISOString()
            });
          }

          // Redirect to home page after successful verification
          router.push('/');
        } else {
          throw new Error('Invalid verification link');
        }
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Invalid verification link');
        // Redirect to home page after error
        router.push('/');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyUser();
  }, [router, searchParams, supabase]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {isVerifying ? (
          <>
            <h1 className="text-2xl font-bold mb-2">Verifying your email...</h1>
            <p>Please wait while we confirm your email address.</p>
          </>
        ) : (
          <p>Redirecting to home page...</p>
        )}
      </div>
    </div>
  );
}