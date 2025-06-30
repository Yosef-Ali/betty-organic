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
    <div className="flex-1 space-y-3 p-4 sm:space-y-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
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
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
            <CardDescription>
              View and track your recent orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-32">
                  <div className="text-muted-foreground">Loading orders...</div>
                </div>
              }
            >
              <OrderHistory userId={user.id} filterByCustomer={true} />
            </Suspense>
          </CardContent>
        </Card>
      ) : (
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-32">
              <div className="text-muted-foreground">Loading orders...</div>
            </div>
          }
        >
          <OrderDashboard />
        </Suspense>
      )}
    </div>
  );
}
