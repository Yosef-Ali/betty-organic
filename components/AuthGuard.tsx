"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { Skeleton } from "@/components/ui/skeleton"

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth/login');
    }
  }, [session, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[110px] rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <Skeleton className="h-[400px] rounded-lg" />
            </div>
            <div className="col-span-3">
              <Skeleton className="h-[400px] rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return session ? <>{children}</> : null;
};

export default AuthGuard;
