"use client";

import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast";
import { useUser } from '@/lib/hooks/useUser';
import { useAuth } from '@/lib/hooks/useAuth';
import { Share2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { v4 as uuidv4 } from 'uuid';
import { useEffect } from 'react';

interface ConfirmPurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: {
    id: string;
    name: string;
    pricePerKg: number;
    grams: number;
  }[];
  total: number;
}

export function ConfirmPurchaseDialog({
  open,
  onOpenChange,
  items,
  total,
}: ConfirmPurchaseDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const { isAuthenticated } = useAuth();
  const supabase = createClientComponentClient();

  const handleCheckout = async () => {
    // Check authentication only when trying to checkout
    if (!isAuthenticated || !user) {
      toast({
        title: "Sign in Required",
        description: "Please sign in first to complete your purchase. You'll be redirected to the login page.",
        variant: "default",
      });
      router.push('/auth/login');
      onOpenChange(false);
      return;
    }

    try {
      // Create order with required fields
      const orderData = {
        customer_id: user.id,
        total_amount: Number(total.toFixed(2)), // Ensure decimal precision
        status: "pending",
        type: "online",
      };

      console.log("User ID:", user.id);
      console.log("Creating order with data:", orderData);

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error("Order creation error:", {
          error: orderError,
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint,
          code: orderError.code
        });

        toast({
          title: "Order Creation Failed",
          description: orderError.message || "Failed to create order. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log("Order created successfully:", order);

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        quantity: Math.max(1, Math.round(item.grams / 1000)), // Ensure minimum quantity of 1
        price: Number((item.pricePerKg * item.grams / 1000).toFixed(2)), // Ensure decimal precision
        product_name: item.name
      }));

      console.log("Creating order items:", orderItems);

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) {
        console.error("Order items creation error:", {
          error: itemsError,
          message: itemsError.message,
          details: itemsError.details,
          hint: itemsError.hint,
          code: itemsError.code
        });

        toast({
          title: "Order Items Creation Failed",
          description: itemsError.message || "Failed to create order items. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Order Confirmed!",
        description: `Your order has been placed successfully. We'll process it right away.`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating order:", {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      });

      let errorMessage = "There was a problem placing your order.";
      if (error?.message?.includes("timeout")) {
        errorMessage = "Connection timeout. Please check your internet connection and try again.";
      } else if (error?.message?.includes("auth")) {
        errorMessage = "Please sign in again and retry your order.";
      }

      toast({
        title: "Order Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Orders</DialogTitle>
          <DialogDescription>
            Are you sure you want to place this order?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="font-medium">Total: ETB {total.toFixed(2)}</p>
          <p className="text-sm text-gray-500">
            This will create a new order with {items.length} items
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const message = `I just placed an order for ${items.length} items totaling ETB ${total.toFixed(2)}!`;
              const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
              window.open(url, "_blank");
            }}
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share via WhatsApp
          </Button>
          <Button onClick={handleCheckout}>
            Confirm Orders
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
