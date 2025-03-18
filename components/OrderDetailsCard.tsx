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
  display_id?: string;
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
  createdAt: string;
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
    total: Number(item.price) * Number(item.quantity),
  }));

  // Calculate subtotal from items
  const subtotal = itemsWithTotal.reduce((acc, item) => acc + Number(item.total), 0);

  return (
    <Card className="overflow-hidden">
      <OrderHeader
        order={{
          id: order.id,
          display_id: order.display_id,
          createdAt: order.createdAt
        }}
        onTrashClick={() => setIsDialogOpen(true)}
      />

      <CardContent className="p-6 text-sm">
        <div className="grid gap-3">
          <div className="font-semibold">Order Details</div>
          <ul className="grid gap-3">
            {itemsWithTotal.map(item => (
              <li key={item.id} className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {item.product?.name || 'Unknown Product'} x{' '}
                  <span>{(item.quantity / 1000).toFixed(3)} kg</span>
                </span>
                <span>Br {item.total.toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <Separator className="my-2" />

          <ul className="grid gap-3">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Br {subtotal.toFixed(2)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">Br {(0).toFixed(2)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="text-muted-foreground">Br {(0).toFixed(2)}</span>
            </li>
            <li className="flex items-center justify-between font-semibold">
              <span className="text-muted-foreground">Total</span>
              <span>Br {subtotal.toFixed(2)}</span>
            </li>
          </ul>
        </div>

        <Separator className="my-4" />
        <>
          <ShippingBillingInfo
            profileName={order.profile?.name || 'Unknown Customer'}
            shippingAddress={{
              name: order.profile?.name || 'Unknown Customer',
              street: 'N/A',
              city: 'N/A',
              state: 'N/A',
              zipCode: 'N/A'
            }}
          />

          <Separator className="my-4" />
          <ProfileDetails
            profile={{
              id: order.profile?.id || 'temp-id',
              name: order.profile?.name || 'Unknown Customer',
              email: order.profile?.email || 'No Email',
              role: order.profile?.role || 'customer',
              status: 'active',
              auth_provider: 'email',
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
        <OrderPagination onPrevious={() => { }} onNext={() => { }} />
      </CardFooter>

      <ConfirmOrderDeleteDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
}
