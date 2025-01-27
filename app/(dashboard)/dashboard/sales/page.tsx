import { Suspense } from 'react';
import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import SalesPage from '@/components/SalesPage';
import { SalesPageSkeleton } from '@/components/sales/SalesPageSkeleton';

export default async function SalesDashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Sales Dashboard</h2>
          <p className="text-muted-foreground">
            Manage sales and track inventory
          </p>
        </div>
      </div>
      <Suspense fallback={<SalesPageSkeleton />}>
        <SalesPage />
      </Suspense>
    </div>
  );
}
