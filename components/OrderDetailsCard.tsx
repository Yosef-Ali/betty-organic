"use client";

import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrderDetails } from "@/lib/hooks/useOrderDetails";
import { calculateOrderTotals } from "@/utils/orders/orderCalculations";
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
      <Card className="overflow-hidden w-full">
        <div className="border-b bg-muted/50 px-4 sm:px-6 py-3 sm:py-4">
          <div className="h-5 sm:h-6 w-32 sm:w-48 bg-muted animate-pulse rounded mb-2"></div>
          <div className="h-3 sm:h-4 w-24 sm:w-32 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex items-center justify-center py-6 sm:py-8">
            <div className="flex flex-col items-center space-y-3">
              <div className="h-5 sm:h-6 w-5 sm:w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs sm:text-sm text-muted-foreground">
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

  // --- Start Calculation using universal utility ---
  const { subtotal, deliveryCost, discountAmount, totalAmount, items: calculatedItems } = calculateOrderTotals(order as any);

  // Use the properly calculated items from the universal calculator
  const itemsWithTotal = (order.items || []).map((item, index) => {
    const calculatedItem = calculatedItems[index];
    return {
      ...item,
      total: calculatedItem ? calculatedItem.totalPrice : Number(item.price || 0),
      displayQuantity: calculatedItem ? calculatedItem.quantity : (item.quantity || 1),
      unitPrice: calculatedItem ? calculatedItem.unitPrice : Number(item.price || 0),
    };
  });
  // --- End Calculation ---

  // Safely access profile information with guest logic and fallbacks
  let profileName = "Unknown Customer";
  let profileEmail = "No Email";
  let profileRole = "customer";
  let profilePhone = null;
  let profileAddress = null;
  
  if (order.is_guest_order) {
    // Handle guest orders
    profileName = order.guest_name ? `Guest: ${order.guest_name}` : "Online Guest";
    profileEmail = order.guest_email || "guest@bettyorganic.com";
    profileRole = "guest";
    profilePhone = order.guest_phone;
    profileAddress = order.guest_address;
  } else {
    // Handle regular customer orders
    profileName = order.profile?.name || order.customer?.name || "Unknown Customer";
    profileEmail = order.profile?.email || order.customer?.email || "No Email";
    profileRole = order.profile?.role || order.customer?.role || "customer";
    profilePhone = order.profile?.phone || order.customer?.phone;
    profileAddress = order.profile?.address || order.customer?.address;
  }
  
  const profileId = order.profile?.id || "temp-id";
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

      <CardContent className="p-3 sm:p-4 lg:p-6 text-sm">
        <div className="grid gap-3">
          <div className="font-semibold text-base sm:text-lg">Order Details</div>
          <ul className="grid gap-2 sm:gap-3">
            {itemsWithTotal.map((item) => (
              <li key={item.id} className="flex items-start justify-between py-2 border-b border-border/50">
                <div className="text-muted-foreground flex-1 pr-2">
                  <div className="font-medium text-foreground text-sm">
                    {item.product?.name || "Unknown Product"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {item.displayQuantity}kg @ Br {item.unitPrice.toFixed(2)}/kg
                  </div>
                </div>
                <span className="font-medium text-sm">Br {item.total.toFixed(2)}</span>
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
              <span className="text-right max-w-[60%] truncate">{profileName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="text-right max-w-[60%] truncate text-xs sm:text-sm">{profileEmail}</span>
            </div>
            {profilePhone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone:</span>
                <span>{profilePhone}</span>
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
              <span className="text-right max-w-[60%] break-words text-xs sm:text-sm">{profileAddress || "Address not provided"}</span>
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
          paymentStatus={currentOrderStatus === 'completed' ? "paid" : "pending"} // Payment received when order completed for COD
          onStatusChange={(newStatus) => {
            setCurrentOrderStatus(newStatus);
            // Trigger a refresh to get updated data
            handleRetry();
          }}
        />
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t bg-muted/50 px-3 sm:px-4 lg:px-6 py-3 gap-2 sm:gap-0">
        <div className="text-xs text-muted-foreground">
          Updated{" "}
          <time dateTime={order.updatedAt || new Date().toISOString()}>
            {order.updatedAt
              ? new Date(order.updatedAt).toLocaleDateString()
              : "Just now"}
          </time>
        </div>
        <div className="hidden sm:block">
          <OrderPagination onPrevious={() => { }} onNext={() => { }} />
        </div>
      </CardFooter>

      <ConfirmOrderDeleteDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </Card>
  );
}
