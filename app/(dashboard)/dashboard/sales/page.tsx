'use client';

import { Suspense } from 'react';
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
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="flex-1 space-y-2 px-8">
        <h2 className="text-2xl font-bold mb-4">Sales Dashboard</h2>
      </div>
      <SalesPage />
    </Suspense>
  );
}
