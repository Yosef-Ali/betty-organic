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
  total_amount: number;
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

  // Process items with safe type checking
  const itemsWithTotal = order.items.map(item => ({
    ...item,
    total: Number(item.price) * Number(item.quantity),
  }));

  // Use the order's total_amount directly
  const totalAmount = order.total_amount || 0;

  // Safely access profile information with fallbacks
  const profileName = order.profile?.name || 'Unknown Customer';
  const profileEmail = order.profile?.email || 'No Email';
  const profileId = order.profile?.id || 'temp-id';
  const profileRole = order.profile?.role || 'customer';
  const profileCreatedAt = order.profile?.created_at || new Date().toISOString();
  const profileUpdatedAt = order.profile?.updated_at || new Date().toISOString();
  const profileAvatarUrl = order.profile?.avatar_url || undefined;

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
          <div className="font-semibold">Order Detailsnnnnnnnn</div>
          <ul className="grid gap-3">
            {itemsWithTotal.map(item => (
              <li key={item.id} className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {item.product?.name || 'Unknown Product'} x{' '}
                  <span>{Number(item.quantity).toFixed(0)} g</span>
                </span>
                <span>Br {item.total.toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <Separator className="my-2" />

          <ul className="grid gap-3">
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
              <span>Br {totalAmount.toFixed(2)}</span>
            </li>
          </ul>
        </div>

        <Separator className="my-4" />
        <>
          <ShippingBillingInfo
            profileName={profileName}
            shippingAddress={{
              name: profileName,
              street: 'N/A',
              city: 'N/A',
              state: 'N/A',
              zipCode: 'N/A'
            }}
          />

          <Separator className="my-4" />
          <ProfileDetails
            profile={{
              id: profileId,
              name: profileName,
              email: profileEmail,
              role: profileRole,
              status: 'active',
              auth_provider: 'email',
              created_at: profileCreatedAt,
              updated_at: profileUpdatedAt,
              avatar_url: profileAvatarUrl,
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
