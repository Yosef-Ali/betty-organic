import { Suspense } from 'react';
import OrderDashboard from '@/components/OrderDashboard';
import { getUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export default async function OrdersDashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="flex-1 space-y-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground">
            View and manage order information
          </p>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading orders...</div>
          </div>
        }
      >
        <OrderDashboard />
      </Suspense>
    </div>
  );
}
