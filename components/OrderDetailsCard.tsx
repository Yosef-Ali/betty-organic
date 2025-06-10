"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrderDetails } from "@/lib/hooks/useOrderDetails";
import { useRealtime } from "@/lib/supabase/realtime-provider";
import { useRouter } from "next/navigation";
import { Profile } from "@/lib/types/auth";

// Order components
import OrderHeader from "@/components/orders/OrderHeader";
import OrderItemsList from "@/components/orders/OrderItemsList";
import OrderError from "@/components/orders/OrderError";
import ProfileDetails from "@/components/orders/CustomerDetails";
import PaymentDetails from "@/components/orders/PaymentDetails";
import ShippingBillingInfo from "@/components/orders/ShippingBillingInfo";
import ConfirmOrderDeleteDialog from "@/components/orders/ConfirmOrderDeleteDialog";
import OrderPagination from "@/components/orders/OrderPagination";

interface OrderDetailsProps {
  orderId: string;
}

interface OrderWithProfile {
  id: string;
  display_id?: string;
  status?: string;
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
  delivery_cost?: number;
  coupon_code?: string;
  discount_amount?: number;
  coupon?: {
    code: string;
    discount_amount: number;
    discount_type: 'percentage' | 'fixed';
  };
}

export default function OrderDetailsCard({ orderId }: OrderDetailsProps) {
  const router = useRouter();
  const { subscribeToOrders } = useRealtime();
  const [currentOrderStatus, setCurrentOrderStatus] = useState<string>('pending');
  
  const {
    order,
    error,
    isLoading,
    isDialogOpen,
    setIsDialogOpen,
    handleConfirmDelete,
    handleRetry,
    retryCount,
  } = useOrderDetails(orderId);

  // Update local status when order changes
  React.useEffect(() => {
    if (order?.status) {
      setCurrentOrderStatus(order.status);
    }
  }, [order?.status]);

  // Subscribe to realtime updates for order details refresh
  React.useEffect(() => {
    if (!orderId) return;
    
    const handleOrderDetailUpdate = (updatedOrder: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
      // If this is the order we're showing, refresh it
      if (updatedOrder.id === orderId && (event === 'UPDATE' || event === 'INSERT')) {
        handleRetry();
      }
    };

    const unsubscribe = subscribeToOrders(handleOrderDetailUpdate);
    return unsubscribe;
  }, [orderId, subscribeToOrders, handleRetry]);

  if (!orderId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Select an order to view details
      </div>
    );
  }

  if (error) {
    return (
      <OrderError
        error={error}
        onLogin={() => router.push("/auth/signin")}
        onRetry={handleRetry}
        retryCount={retryCount}
      />
    );
  }

  if (isLoading || !order) {
    return (
      <Card className="overflow-hidden">
        <div className="border-b bg-muted/50 px-6 py-4">
          <div className="h-6 w-48 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground">
                Loading order details...
              </p>
              <p className="text-xs text-muted-foreground">
                This may take a moment
              </p>

              {/* Add a refresh button that appears after 5 seconds */}
              <div className="pt-2">
                <button
                  onClick={handleRetry}
                  className="text-xs text-primary hover:underline mt-2 flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Retry Loading{" "}
                  {retryCount > 0 ? `(Attempt ${retryCount + 1})` : ""}
                </button>
              </div>
            </div>
          </div>

          {/* Skeleton loading UI */}
          <div className="space-y-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
            <div className="space-y-2">
              <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
            </div>
          </div>

          <div className="h-px w-full bg-muted my-4"></div>

          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  // --- Start Calculation ---
  // Process items with safe type checking  
  const itemsWithTotal = order.items.map((item) => ({
    ...item,
    total: Number(item.price || 0), // item.price is already the total for this line item
  }));

  // Calculate subtotal from items
  const subtotal = itemsWithTotal.reduce((sum, item) => sum + item.total, 0);

  // Get discount with fallback
  const discountAmount = order.discount_amount || 0;

  // --- Adjusted Delivery Cost Calculation ---
  // Prioritize explicitly provided delivery_cost if > 0
  // Otherwise, infer it from the difference between db total and subtotal (minus discount)
  let inferredDeliveryCost = 0;
  if (order.total_amount && order.total_amount > (subtotal - discountAmount)) {
    inferredDeliveryCost = order.total_amount - subtotal + discountAmount;
  }
  const deliveryCost = (order.delivery_cost && order.delivery_cost > 0) ? order.delivery_cost : inferredDeliveryCost;
  // --- End Adjusted Delivery Cost Calculation ---

  // Calculate the correct total amount including delivery and discount
  // Recalculate based on potentially inferred deliveryCost
  const calculatedTotal = subtotal + deliveryCost - discountAmount;

  // Use the database total_amount as the primary source of truth if available, otherwise use calculated
  // This ensures the displayed total matches the database record when possible.
  const totalAmount = order.total_amount || calculatedTotal;

  // Safely access profile information with fallbacks
  const profileName = order.profile?.name || "Unknown Customer";
  const profileEmail = order.profile?.email || "No Email";
  const profileId = order.profile?.id || "temp-id";
  const profileRole = order.profile?.role || "customer";
  const profileCreatedAt =
    order.profile?.created_at || new Date().toISOString();
  const profileUpdatedAt =
    order.profile?.updated_at || new Date().toISOString();
  const profileAvatarUrl = order.profile?.avatar_url || null;

  return (
    <Card className="overflow-hidden">
      <OrderHeader
        order={{
          id: order.id,
          display_id: order.display_id,
          createdAt: order.createdAt,
        }}
        onTrashClick={() => setIsDialogOpen(true)}
      />

      <CardContent className="p-6 text-sm">
        <div className="grid gap-3">
          <div className="font-semibold">Order Details</div>
          <ul className="grid gap-3">
            {itemsWithTotal.map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {item.product?.name || "Unknown Product"} x{" "}
                  <span>{item.price} /kg</span>
                </span>
                <span>Br {item.total.toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <Separator className="my-2" />

          <ul className="grid gap-3">
            {/* Subtotal */}
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-muted-foreground">
                Br {subtotal.toFixed(2)}
              </span>
            </li>

            {/* Delivery Cost */}
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-muted-foreground">
                {/* Display the potentially inferred deliveryCost */}
                Br {deliveryCost.toFixed(2)}
              </span>
            </li>

            {/* Discount */}
            {((order.coupon_code && order.coupon_code.length > 0) || discountAmount > 0) && (
              <li className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  Discount {order.coupon_code && `(${order.coupon_code})`}
                </span>
                <span className="text-green-600">
                  -Br {discountAmount.toFixed(2)}
                </span>
              </li>
            )}

            {/* Tax */}
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="text-muted-foreground">Br {(0).toFixed(2)}</span>
            </li>

            {/* Total Amount */}
            <li className="flex items-center justify-between font-semibold">
              <span className="text-muted-foreground">Total</span>
              {/* Display the final totalAmount (prioritizing dbTotalAmount) */}
              <span>Br {totalAmount.toFixed(2)}</span>
            </li>
          </ul>
        </div>

        <Separator className="my-4" />
        
        {/* Customer Information Section */}
        <div className="space-y-3">
          <div className="font-semibold">Customer Information</div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name:</span>
              <span>{profileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{profileEmail}</span>
            </div>
            {order.profile?.phone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span>{order.profile.phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer Type:</span>
              <span className="capitalize">{profileRole}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer Since:</span>
              <span>{new Date(profileCreatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <Separator className="my-4" />
        
        {/* Order Location & Delivery Section */}
        <div className="space-y-3">
          <div className="font-semibold">Delivery Information</div>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Address:</span>
              <span>{order.profile?.address || "Address not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Cost:</span>
              <span>Br {(deliveryCost || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Type:</span>
              <span className="capitalize">{order.type || 'standard'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Date:</span>
              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order Time:</span>
              <span>{new Date(order.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <Separator className="my-4" />
        <PaymentDetails 
          orderId={order.id}
          orderStatus={currentOrderStatus}
          totalAmount={totalAmount}
          paymentStatus="paid" // Cash orders are considered paid on delivery
          onStatusChange={(newStatus) => {
            setCurrentOrderStatus(newStatus);
            // Trigger a refresh to get updated data
            handleRetry();
          }}
        />
      </CardContent>

      <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Updated{" "}
          <time dateTime={order.updatedAt || new Date().toISOString()}>
            {order.updatedAt
              ? new Date(order.updatedAt).toLocaleDateString()
              : "Just now"}
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
