"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { formatOrderCurrency } from "@/lib/utils";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Order } from "@/types/order";
import { deleteOrder } from "@/app/actions/orderActions";
import { calculateOrderTotals } from "@/utils/orders/orderCalculations";

export type OrderDetailsProps = {
  orderId: string;
};

export function OrderDetails({ orderId }: OrderDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch order data implementation here...

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const result = await deleteOrder(orderId);
      if (result.success) {
        toast({
          title: "Order deleted",
          description: "The order has been successfully deleted.",
        });
        router.push("/dashboard/orders");
      }
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete the order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (!orderId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Select an order to view details
      </div>
    );
  }

  if (error) {
    return (
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-destructive">Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => router.push("/auth/signin")}>
            Return to Sign In
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!order || isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Loading order details...
      </div>
    );
  }

  // Apply universal total calculation
  const { subtotal, deliveryCost, discountAmount, totalAmount, items: calculatedItems } = calculateOrderTotals(order as any);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/50 px-6">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Order #{order.id}</CardTitle>
            <CardDescription>
              Created{" "}
              {formatDistanceToNow(new Date(order.created_at ?? Date.now()))}{" "}
              ago
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-6 text-sm">
        <div className="space-y-4">
          {calculatedItems?.length ? (
            calculatedItems.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-muted-foreground">
                    {item.quantity}kg × Br {item.unitPrice.toFixed(2)}/kg
                  </p>
                </div>
                <p>{formatOrderCurrency(item.totalPrice)}</p>
              </div>
            ))
          ) : (
            <p>No items in this order</p>
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-2">
          <h3 className="font-medium">Customer Details</h3>
          <p>
            {order.is_guest_order 
              ? (order.guest_name ? `Guest: ${order.guest_name}` : "Online Guest")
              : (order.customer?.name || "Unknown Customer")
            }
          </p>
          <p>
            {order.is_guest_order
              ? (order.guest_email || "guest@bettyorganic.com")
              : (order.customer?.email || "No email provided")
            }
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <p>Subtotal</p>
            <p>{formatOrderCurrency(subtotal)}</p>
          </div>
          {deliveryCost > 0 && (
            <div className="flex justify-between">
              <p>Delivery</p>
              <p>{formatOrderCurrency(deliveryCost)}</p>
            </div>
          )}
          {discountAmount > 0 && (
            <div className="flex justify-between">
              <p>Discount</p>
              <p className="text-green-600">-{formatOrderCurrency(discountAmount)}</p>
            </div>
          )}
          <div className="flex justify-between font-medium">
            <p>Total</p>
            <p>{formatOrderCurrency(totalAmount)}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t bg-muted/50 px-6 py-3">
        <p className="text-xs text-muted-foreground">
          Status: <span className="font-medium">{order?.status}</span>
        </p>
        {order?.updated_at && (
          <p className="text-xs text-muted-foreground">
            Last updated: {formatDistanceToNow(new Date(order.updated_at))} ago
          </p>
        )}
      </CardFooter>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the order and its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
