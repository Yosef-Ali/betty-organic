'use client';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useOrderDetails } from '@/lib/hooks/useOrderDetails';
import { useRouter } from 'next/navigation';
import { Profile } from '@/lib/types/auth';

// Order components
import OrderHeader from '@/components/orders/OrderHeader';
import OrderItemsList from '@/components/orders/OrderItemsList';
import OrderError from '@/components/orders/OrderError';
import ProfileDetails from '@/components/orders/CustomerDetails';
import PaymentDetails from '@/components/orders/PaymentDetails';
import ShippingBillingInfo from '@/components/orders/ShippingBillingInfo';
import ConfirmOrderDeleteDialog from '@/components/orders/ConfirmOrderDeleteDialog';
import OrderPagination from '@/components/orders/OrderPagination';

interface OrderDetailsProps {
  orderId: string;
}

interface OrderWithProfile {
  id: string;
  items: Array<{
    id: string;
    product: {
      name: string;
    };
    price: number;
    quantity: number;
  }>;
  profile: Profile;
  updatedAt?: string;
}

export default function OrderDetails({ orderId }: OrderDetailsProps) {
  const router = useRouter();
  const { order, error, isDialogOpen, setIsDialogOpen, handleConfirmDelete } =
    useOrderDetails(orderId);

  if (!orderId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Select an order to view details
      </div>
    );
  }

  if (error) {
    return (
      <OrderError error={error} onLogin={() => router.push('/auth/signin')} />
    );
  }

  if (!order) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading order details...
      </div>
    );
  }

  // Process items with safe type checking and calculations
  const itemsWithTotal = order.items.map(item => ({
    ...item,
    total: item.price * item.quantity,
  }));

  const subtotal = itemsWithTotal.reduce((acc, item) => acc + item.total, 0);

  return (
    <Card className="overflow-hidden">
      <OrderHeader order={order} onTrashClick={() => setIsDialogOpen(true)} />

      <CardContent className="p-6 text-sm">
        <OrderItemsList items={itemsWithTotal} subtotal={subtotal} />

        <Separator className="my-4" />
        <>
          <ShippingBillingInfo
            address={order.profile?.name || 'N/A'}
            city={order.profile?.email || 'N/A'}
            postalCode={order.profile?.email || 'N/A'}
          />

          <Separator className="my-4" />
          <ProfileDetails
            profile={{
              id: order.profile?.id || 'temp-id',
              name: order.profile?.name || 'Unknown Customer',
              email: order.profile?.email || 'No Email',
              role: order.profile?.role || 'customer',
              status: 'active',
              created_at: order.profile?.created_at || new Date().toISOString(),
              updated_at: order.profile?.updated_at || new Date().toISOString(),
              avatar_url: order.profile?.avatar_url || undefined,
            }}
          />
        </>

        <Separator className="my-4" />
        <PaymentDetails />
      </CardContent>

      <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Updated{' '}
          <time dateTime={order.updatedAt || new Date().toISOString()}>
            {order.updatedAt
              ? new Date(order.updatedAt).toLocaleDateString()
              : 'Just now'}
          </time>
        </div>
        <OrderPagination onPrevious={() => {}} onNext={() => {}} />
      </CardFooter>

      <ConfirmOrderDeleteDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
}
