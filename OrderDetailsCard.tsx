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

  // Use the order data directly without recalculation
  const itemsWithTotal = order.items.map(item => ({
    ...item,
    total: Number(item.price) * Number(item.quantity), // Calculate item total
  }));

  // Calculate subtotal from items
  const subtotal = itemsWithTotal.reduce((acc, item) => acc + item.total, 0);

  // Calculate total amount manually
  const deliveryCost = Number(order.delivery_cost) || 0;
  const discountAmount = Number(order.discount_amount) || 0;
  // Assuming tax is 0 as it's displayed as '0.00'
  const calculatedTotalAmount = subtotal + deliveryCost - discountAmount;

  // Safely access profile information with fallbacks
  const profileName = order.profile?.name || 'Unknown Customer';
  const profileEmail = order.profile?.email || 'No Email';
  const profileId = order.profile?.id || 'temp-id';
  const profileRole = order.profile?.role || 'customer';
  const profileCreatedAt = order.profile?.created_at || new Date().toISOString();
  const profileUpdatedAt = order.profile?.updated_at || new Date().toISOString();
  const profileAvatarUrl = order.profile?.avatar_url || undefined;
  const profileAddress = order.profile?.address || null; // Add address fallback
  const profilePhone = order.profile?.phone || null; // Add phone fallback

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
                  <span>{Number(item.quantity)}</span>
                </span>
                <span>Br {Number(item.total).toLocaleString('et-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </li>
            ))}
          </ul>

          <Separator className="my-2" />

          <ul className="grid gap-3">
            {/* Add Subtotal line */}
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>Br {Number(subtotal).toLocaleString('et-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivery Cost</span>
              <span className="text-muted-foreground">
                Br {order.delivery_cost ? Number(order.delivery_cost).toLocaleString('et-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </span>
            </li>
            {((order.coupon_code && order.coupon_code.length > 0) || order.coupon?.code) && (
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Coupon</span>
                <span className="font-medium text-green-600">
                  {order.coupon_code || order.coupon?.code}
                </span>
              </li>
            )}
            {(order.discount_amount !== undefined && order.discount_amount > 0) && (
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-green-600">
                  -Br {Number(order.discount_amount).toLocaleString('et-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </li>
            )}
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="text-muted-foreground">Br {'0.00'}</span>
            </li>
            <li className="flex items-center justify-between font-semibold">
              <span className="text-muted-foreground">Total</span>
              {/* Use calculatedTotalAmount for display */}
              <span>Br {Number(calculatedTotalAmount).toLocaleString('et-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
              avatar_url: profileAvatarUrl || null,
              address: profileAddress, // Add address property
              phone: profilePhone, // Add phone property
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
