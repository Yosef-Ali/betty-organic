'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function SalesPageSkeleton() {
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
