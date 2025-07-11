import { Suspense } from 'react';
import OrderDashboard from '@/components/OrderDashboard';
import { OrderHistory } from '@/components/OrderHistory';
import { getUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

export default async function OrdersDashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const isCustomer = user.profile?.role === 'customer';

  return (
    <div className="flex-1 space-y-3 p-3 sm:space-y-4 sm:p-4 md:p-6 lg:p-8">
      <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
            {isCustomer ? 'My Orders' : 'Orders'}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {isCustomer
              ? 'View your order history and track order status'
              : 'View and manage order information'
            }
          </p>
        </div>
      </div>

      {isCustomer ? (
        <Card className="w-full">
          <CardHeader className="space-y-1 p-3 sm:p-4 lg:p-6">
            <CardTitle className="text-lg sm:text-xl">Order History</CardTitle>
            <CardDescription className="text-sm">
              View and track your recent orders
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground text-sm">Loading orders...</div>
                </div>
              }
            >
              <OrderHistory userId={user.id} filterByCustomer={true} />
            </Suspense>
          </CardContent>
        </Card>
      ) : (
        <div className="w-full">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-32">
                <div className="text-muted-foreground text-sm">Loading orders...</div>
              </div>
            }
          >
            <OrderDashboard />
          </Suspense>
        </div>
      )}
    </div>
  );
}
