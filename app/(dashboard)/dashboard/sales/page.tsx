'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/auth/AuthContext';
import SalesPage from '@/components/SalesPage';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingSkeleton() {
  return (
    <div className="flex-1 space-y-4 p-4">
      <Skeleton className="h-8 w-[200px]" />
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-[180px] rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export default function SalesDashboardPage() {
  const { isSales, isAdmin, isLoading } = useAuthContext();
  const router = useRouter();

  const hasAccess = isAdmin || isSales;

  useEffect(() => {
    // Only redirect if user is not loading and has no access
    if (!isLoading && !hasAccess) {
      console.log('⚠️ Unauthorized access attempt - redirecting to profile');
      router.replace('/dashboard/profile');
    }
  }, [hasAccess, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Only render page content if user has access
  if (!hasAccess) {
    return null; // Prevent flash of content during redirect
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="flex-1 space-y-2 px-8">
        <h2 className="text-2xl font-bold mb-4">Sales Dashboard</h2>
        <SalesPage />
      </div>
    </Suspense>
  );
}
