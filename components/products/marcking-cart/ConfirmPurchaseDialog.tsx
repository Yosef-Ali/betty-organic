'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CartItemType } from "@/types/cart";
import { useState } from "react";
import { useMarketingCartStore } from "@/store/cartStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { handlePurchaseOrder } from "@/app/actions/purchaseActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { sendWhatsAppOrderNotification } from "@/app/(marketing)/actions/notificationActions";
import { MapPin, Phone, User, MessageCircle, LogIn, Share2 } from 'lucide-react';
import { useAuth } from "@/components/providers/AuthProvider";

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

interface ConfirmPurchaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemType[];
  total: number;
}

export const ConfirmPurchaseDialog = ({
  isOpen,
  onClose,
  items,
  total,
}: ConfirmPurchaseDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'review' | 'details'>('review');
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
  });
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const clearCart = useMarketingCartStore((state) => state.clearCart);
  const router = useRouter();
  const { user, profile, isLoading } = useAuth();

  const handleInfoChange = (field: keyof CustomerInfo) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const isCustomerInfoValid = () => {
    return customerInfo.phone.length >= 9 && customerInfo.address.trim().length > 0;
  };

  const formatPhoneNumber = (phone: string) => {
    // Format for Ethiopian phone numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('251')) {
      return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
      return `+251${cleaned.slice(1)}`;
    }
    return `+251${cleaned}`;
  };

  const handleSignIn = () => {
    // Store cart items in localStorage before redirecting
    localStorage.setItem('pendingCart', JSON.stringify({
      items,
      customerInfo,
      timestamp: Date.now()
    }));
    router.push('/auth/login?returnTo=/');
  };

  const handleShareWhatsApp = () => {
    if (!orderDetails) return;

    // The notification code is already implemented in sendWhatsAppOrderNotification
    sendWhatsAppOrderNotification(orderDetails)
      .then(() => {
        // WhatsApp URL is handled by the server action, no need for additional code here
        toast.success("WhatsApp notification ready!");
      })
      .catch((err: Error) => {
        console.error("Failed to prepare WhatsApp notification:", err.message);
        toast.error("Failed to prepare WhatsApp message.");
      });
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);

      if (!items.length) {
        throw new Error("No items in cart");
      }

      if (!isCustomerInfoValid()) {
        throw new Error("Please provide valid contact information");
      }

      // Store customer data in localStorage for potential later use
      const customerData = {
        name: user ? (profile?.name || user.email?.split('@')[0] || 'Customer') : (customerInfo.name || 'Guest'),
        email: user?.email || undefined,
        phone: formatPhoneNumber(customerInfo.phone),
        address: customerInfo.address,
        userId: user?.id
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('lastOrderCustomerInfo', JSON.stringify(customerData));
      }

      // Call handlePurchaseOrder with just the parameters it expects
      const result = await handlePurchaseOrder(items, total);

      if (!result.data) {
        throw new Error(result.error || "Failed to create order");
      }

      const orderId = result.data.id;
      // Use the system-generated display_id with type assertion since TypeScript doesn't recognize it
      const displayId = (result.data as any).display_id || `BO${String(orderId).padStart(6, '0')}`;
      const formattedPhone = formatPhoneNumber(customerInfo.phone);
      const customerName = user ? (profile?.name || user.email?.split('@')[0] || 'Customer') : (customerInfo.name || 'Guest');

      const orderDetailsObj = {
        id: orderId,
        display_id: displayId,
        items: items.map(item => ({
          name: item.name,
          grams: item.grams,
          price: ((item.pricePerKg * item.grams) / 1000),
          unit_price: item.pricePerKg
        })),
        total: total,
        customer_name: customerName,
        customer_phone: formattedPhone,
        delivery_address: customerInfo.address,
        customer_email: user?.email || undefined,
        user_id: user?.id || undefined,
        created_at: new Date().toISOString()
      };

      setOrderDetails(orderDetailsObj);
      setOrderPlaced(true);

      // For authenticated users, send WhatsApp notification automatically
      if (user) {
        try {
          await sendWhatsAppOrderNotification(orderDetailsObj);
        } catch (err) {
          console.error("Failed to send WhatsApp notification:", err);
          // Don't throw error here, just log it since the order was already created
        }
      }

      // Show success message
      toast.success(`Order ${displayId} created successfully!`, {
        description: user
          ? "Admin has been notified of your order."
          : "Click 'Share via WhatsApp' to notify admin.",
      });

      // Clear cart
      clearCart();

    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to place order");
      setOrderPlaced(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReviewStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Review Your Order</DialogTitle>
        <DialogDescription>
          Please review your items before proceeding to delivery details.
        </DialogDescription>
      </DialogHeader>

      <ScrollArea className="max-h-[300px] mt-4">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center py-2 border-b">
              <div className="flex flex-col">
                <span className="font-medium">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{item.grams}g</span>
                  <span className="text-xs text-gray-400">
                    (ETB {item.pricePerKg}/kg)
                  </span>
                </div>
              </div>
              <span className="font-medium">
                ETB {((item.pricePerKg * item.grams) / 1000).toFixed(2)}
              </span>
            </div>
          ))}
          <div className="pt-4 border-t flex justify-between font-bold">
            <span>Total:</span>
            <span>ETB {total.toFixed(2)}</span>
          </div>
        </div>
      </ScrollArea>

      <DialogFooter className="flex sm:justify-between gap-4 sm:gap-0">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => setCurrentStep('details')}>
          Continue to Details
        </Button>
      </DialogFooter>
    </>
  );

  const renderDetailsStep = () => (
    <>
      <DialogHeader>
        <DialogTitle>Delivery Details</DialogTitle>
        <DialogDescription>
          {!user ?
            "Please provide your contact information for delivery." :
            "Please provide delivery address details."
          }
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {!user && (
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Your Name (optional)
            </Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={customerInfo.name}
              onChange={handleInfoChange('name')}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number*
          </Label>
          <Input
            id="phone"
            placeholder="e.g., 0911234567"
            value={customerInfo.phone}
            onChange={handleInfoChange('phone')}
            required
          />
          <p className="text-xs text-gray-500">
            Ethiopian format: 09XXXXXXXX or +251XXXXXXXXX
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Delivery Address*
          </Label>
          <Textarea
            id="address"
            placeholder="Enter your delivery address"
            value={customerInfo.address}
            onChange={handleInfoChange('address')}
            required
            className="min-h-[100px]"
          />
        </div>
      </div>

      {!user && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-700 flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            Sign in to track your orders and for faster checkout next time
          </p>
        </div>
      )}

      <DialogFooter className="flex sm:justify-between gap-4 sm:gap-0">
        <Button variant="outline" onClick={() => setCurrentStep('review')}>
          Back to Review
        </Button>

        {!user ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleSignIn}
              className="gap-2"
            >
              <LogIn className="w-4 h-4" />
              Sign in first
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || !isCustomerInfoValid()}
              className="gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {isSubmitting ? "Processing..." : "Place Order as Guest"}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !isCustomerInfoValid()}
            className="gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {isSubmitting ? "Processing..." : "Confirm Order"}
          </Button>
        )}
      </DialogFooter>
    </>
  );

  const renderOrderPlaced = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-green-600 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          Order Placed Successfully!
        </DialogTitle>
        <DialogDescription>
          {user
            ? "Your order has been confirmed and will be prepared for delivery."
            : "Your order has been created. Share it via WhatsApp to notify the admin."
          }
        </DialogDescription>
      </DialogHeader>

      <div className="my-4 p-4 border rounded-md bg-gray-50">
        <h3 className="font-medium text-lg mb-2">Order #{orderDetails?.display_id}</h3>
        <p className="text-sm text-gray-600 mb-4">
          {new Date(orderDetails?.created_at).toLocaleString()}
        </p>

        <div className="space-y-2 mb-4">
          <p className="text-sm"><span className="font-medium">Delivery Address:</span> {customerInfo.address}</p>
          <p className="text-sm"><span className="font-medium">Contact:</span> {customerInfo.phone}</p>
        </div>

        <div className="text-sm font-medium flex justify-between border-t pt-2">
          <span>Total Amount:</span>
          <span>ETB {total.toFixed(2)}</span>
        </div>
      </div>

      {!user && (
        <div className="mb-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded-md mb-3">
            <p className="text-sm text-green-700 mb-2">
              <strong>Important:</strong> Your order needs to be sent to the admin to complete the process.
            </p>
            <p className="text-xs text-green-600">
              Click the button below to share your order details via WhatsApp and get delivery confirmation.
            </p>
          </div>

          <Button
            variant="default"
            className="w-full gap-2 bg-green-600 hover:bg-green-700"
            onClick={handleShareWhatsApp}
          >
            <Share2 className="w-5 h-5" />
            Share Order via WhatsApp
          </Button>

          <div className="text-center mt-2 text-xs text-muted-foreground">
            Your order will be processed after sharing
          </div>
        </div>
      )}

      <DialogFooter>
        <Button onClick={onClose}>{user ? "Close" : "Close without sharing"}</Button>
        {!user && (
          <Button
            variant="outline"
            onClick={handleSignIn}
            className="gap-1"
          >
            <LogIn className="w-4 h-4" />
            Sign in to track orders
          </Button>
        )}
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {orderPlaced
          ? renderOrderPlaced()
          : currentStep === 'review'
            ? renderReviewStep()
            : renderDetailsStep()
        }
      </DialogContent>
    </Dialog>
  );
};
