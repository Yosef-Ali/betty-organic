"use client";

import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrderDetails } from "@/lib/hooks/useOrderDetails";
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

  // Process items with safe type checking
  const itemsWithTotal = order.items.map((item) => ({
    ...item,
    total: Number(item.price) * Number(item.quantity),
  }));

  // Use the order's total_amount directly
  const totalAmount = order.total_amount || 0;

  // Safely access profile information with fallbacks
  const profileName = order.profile?.name || "Unknown Customer";
  const profileEmail = order.profile?.email || "No Email";
  const profileId = order.profile?.id || "temp-id";
  const profileRole = order.profile?.role || "customer";
  const profileCreatedAt =
    order.profile?.created_at || new Date().toISOString();
  const profileUpdatedAt =
    order.profile?.updated_at || new Date().toISOString();
  const profileAvatarUrl = order.profile?.avatar_url || undefined;

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
                <span>Br {(item.total / 1000).toFixed(2)}</span>
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
              street: "N/A",
              city: "N/A",
              state: "N/A",
              zipCode: "N/A",
            }}
          />

          <Separator className="my-4" />
          <ProfileDetails
            profile={{
              id: profileId,
              name: profileName,
              email: profileEmail,
              role: profileRole,
              status: "active",
              auth_provider: "email",
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
          Updated{" "}
          <time dateTime={order.updatedAt || new Date().toISOString()}>
            {order.updatedAt
              ? new Date(order.updatedAt).toLocaleDateString()
              : "Just now"}
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
