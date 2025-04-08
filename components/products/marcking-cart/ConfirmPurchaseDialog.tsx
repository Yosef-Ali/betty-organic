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
import { useState, useEffect } from "react";
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
import { Profile } from "@/lib/types/auth"; // Import the Profile type with phone property

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
}

interface ConfirmPurchaseDialogProps {
  isOpen: boolean;
  onCloseAction: () => void;
  items: CartItemType[];
  total: number;
}

export const ConfirmPurchaseDialog = ({
  isOpen,
  onCloseAction,
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

  // Debug logging for authentication state
  useEffect(() => {
    console.log("Authentication state in ConfirmPurchaseDialog:", {
      isAuthenticated: !!user,
      userId: user?.id,
      userEmail: user?.email,
      hasProfile: !!profile,
      isLoading
    });
  }, [user, profile, isLoading]);

  // Debug logging for the total amount
  useEffect(() => {
    console.log("Current total in ConfirmPurchaseDialog:", total);
    if (orderDetails) {
      console.log("Order details total:", orderDetails.total);
    }
  }, [total, orderDetails]);

  // Initialize customer info from profile when available
  useEffect(() => {
    if (user && profile && !isLoading) {
      setCustomerInfo(prevInfo => ({
        ...prevInfo,
        name: profile.name || user.email?.split('@')[0] || '',
        phone: profile.phone || '',
        // Only update address if it's not already set by user
        ...(prevInfo.address === '' ? { address: profile.address || '' } : {})
      }));
    }
  }, [user, profile, isLoading]);

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

      // For signed-in users, only address is required
      if (user && !customerInfo.address.trim()) {
        throw new Error("Please provide a delivery address");
      }

      // For non-signed-in users, phone and address are required
      if (!user && !isCustomerInfoValid()) {
        throw new Error("Please provide valid contact information");
      }

      // Use profile data for signed-in users
      const customerName = user ? (profile?.name || user.email?.split('@')[0] || 'Customer') : (customerInfo.name || 'Guest');
      const customerPhone = user && profile?.phone ? profile.phone : formatPhoneNumber(customerInfo.phone);

      // Store customer data in localStorage for potential later use
      const customerData = {
        name: customerName,
        email: user?.email || undefined,
        phone: customerPhone,
        address: customerInfo.address,
        userId: user?.id
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('lastOrderCustomerInfo', JSON.stringify(customerData));
      }

      // For signed-in users, proceed with order placement
      // For non-signed-in users, just prepare order details for WhatsApp sharing
      if (user) {
        // Call handlePurchaseOrder only for signed-in users
        const result = await handlePurchaseOrder(items, total);

        if (!result.data) {
          throw new Error(result.error || "Failed to create order");
        }

        const orderId = result.data.id;
        const displayId = (result.data as any).display_id || `BO${String(orderId).padStart(6, '0')}`;

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
          customer_phone: customerPhone,
          delivery_address: customerInfo.address,
          customer_email: user?.email,
          user_id: user?.id,
          created_at: new Date().toISOString()
        };

        setOrderDetails(orderDetailsObj);

        // For authenticated users, send WhatsApp notification automatically
        try {
          await sendWhatsAppOrderNotification(orderDetailsObj);
        } catch (err) {
          console.error("Failed to send WhatsApp notification:", err);
          // Don't throw error here, just log it since the order was already created
        }

        // Show success message for authenticated users
        toast.success(`Order ${displayId} created successfully!`, {
          description: "Admin has been notified of your order."
        });
      }
      else {
        // For non-signed in users, just prepare the order details for WhatsApp
        const tempOrderId = `TEMP-${Date.now()}`;
        const displayId = `BO-GUEST-${Date.now().toString().slice(-6)}`;
        const formattedPhone = formatPhoneNumber(customerInfo.phone);

        const orderDetailsObj = {
          id: tempOrderId,
          display_id: displayId,
          items: items.map(item => ({
            name: item.name,
            grams: item.grams,
            price: ((item.pricePerKg * item.grams) / 1000),
            unit_price: item.pricePerKg
          })),
          total: total,
          customer_name: customerInfo.name || 'Guest',
          customer_phone: formattedPhone,
          delivery_address: customerInfo.address,
          created_at: new Date().toISOString()
        };

        setOrderDetails(orderDetailsObj);
        toast.success("Order details prepared!", {
          description: "Please share via WhatsApp to complete your order"
        });
      }

      setOrderPlaced(true);
      // Clear cart
      clearCart();

    } catch (error) {
      console.error("Error processing order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process order");
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
        <Button variant="outline" onClick={onCloseAction}>
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
        <DialogDescription className="text-wrap">
          {!user ?
            "Provide your contact details to continue with WhatsApp order" :
            "Please confirm your delivery address."
          }
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4 overflow-hidden">
        {/* For non-signed-in users, show complete form */}
        {!user && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-2">
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Your Name (optional)</span>
              </Label>
              <Input
                id="name"
                placeholder="Enter your name"
                value={customerInfo.name}
                onChange={handleInfoChange('name')}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">Phone Number*</span>
              </Label>
              <Input
                id="phone"
                placeholder="e.g., 0911234567"
                value={customerInfo.phone}
                onChange={handleInfoChange('phone')}
                required
                className="w-full"
              />
              <p className="text-xs text-gray-500 break-words">
                Ethiopian format: 09XXXXXXXX or +251XXXXXXXXX
              </p>
            </div>
          </>
        )}

        {/* For signed-in users, show profile info summary */}
        {user && (
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">{profile?.name || user.email?.split('@')[0]}</span>
            </div>
            {profile?.phone && (
              <div className="flex items-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-sm">{profile.phone}</span>
              </div>
            )}
          </div>
        )}

        {/* Address field for all users */}
        <div className="space-y-2">
          <Label htmlFor="address" className="flex items-center gap-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Delivery Address*</span>
          </Label>
          <Textarea
            id="address"
            placeholder="Enter your delivery address"
            value={customerInfo.address}
            onChange={handleInfoChange('address')}
            required
            className="min-h-[100px] w-full resize-none"
          />
        </div>
      </div>

      {!user && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 flex items-center gap-2 flex-wrap">
            <Share2 className="w-4 h-4 flex-shrink-0" />
            <span className="break-words font-medium">Your order will be completed via WhatsApp</span>
          </p>
          <p className="text-xs text-green-600 mt-1 pl-6">
            After entering your details, you&apos;ll share your order with our admin via WhatsApp
          </p>
        </div>
      )}

      <DialogFooter className="flex flex-row justify-between items-center gap-2 mt-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentStep('review')}
          title="Back to Review"
          className="h-8 w-8 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </Button>

        {!user ? (
          <div className="flex flex-row gap-2 flex-1 justify-end">
            <Button
              variant="outline"
              onClick={handleSignIn}
              className="gap-2"
              size="sm"
            >
              <LogIn className="w-4 h-4" />
              Sign in instead
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isSubmitting || !isCustomerInfoValid()}
              className="gap-2"
              size="sm"
              title="Proceed to WhatsApp sharing"
            >
              <Share2 className="w-4 h-4" />
              {isSubmitting ? "Processing..." : "Continue to WhatsApp"}
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting || !customerInfo.address.trim()}
            className="gap-2"
            size="sm"
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
      {!user ? (
        <>
          <DialogHeader>
            <DialogTitle className="text-green-600 flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Your Order via WhatsApp
            </DialogTitle>
            <DialogDescription>
              Your order has been prepared. Please share it via WhatsApp to complete your order.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 p-4 border rounded-md bg-gray-50">
            <h3 className="font-medium text-lg mb-2">Order Summary</h3>

            <ScrollArea className="max-h-[150px] mb-4">
              <div className="space-y-2">
                {orderDetails?.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} ({item.grams}g)</span>
                    <span>ETB {item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-2 mb-4">
              <p className="text-sm"><span className="font-medium">Delivery to:</span> {customerInfo.address}</p>
              <p className="text-sm"><span className="font-medium">Contact:</span> {customerInfo.phone}</p>
            </div>

            <div className="text-sm font-medium flex justify-between border-t pt-2">
              <span>Total Amount:</span>
              <span>ETB {orderDetails?.total.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              variant="default"
              className="w-full gap-2 bg-green-600 hover:bg-green-700 py-6"
              onClick={handleShareWhatsApp}
              size="lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M6 12v3a3 3 0 0 0 3 3h9a3 3 0 0 0 3-3v-6a3 3 0 0 0-3-3h-9a3 3 0 0 0-3 3v3Z" />
                <path d="m6 12-3 3V9l3 3Z" />
                <line x1="13" y1="12" x2="16" y2="12" />
                <line x1="13" y1="15" x2="16" y2="15" />
              </svg>
              Share Order via WhatsApp
            </Button>
          </div>

          <div className="text-center mt-4 flex flex-col gap-2">
            <div className="text-xs text-muted-foreground">
              Your order will only be processed after sharing via WhatsApp
            </div>
            <div className="flex justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={onCloseAction} className="text-red-500 hover:text-red-700">
                Cancel Order
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignIn}
                className="gap-1"
              >
                <LogIn className="w-4 h-4" />
                Sign in to track
              </Button>
            </div>
          </div>
        </>
      ) : (
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
              Your order has been confirmed and will be prepared for delivery.
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
              <span>ETB {orderDetails?.total.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={onCloseAction}>Close</Button>
          </DialogFooter>
        </>
      )}
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onCloseAction}>
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