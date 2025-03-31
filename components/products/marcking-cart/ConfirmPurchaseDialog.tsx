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
import { MapPin, Phone, User } from 'lucide-react';

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
  const clearCart = useMarketingCartStore((state) => state.clearCart);
  const router = useRouter();

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

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);

      if (!items.length) {
        throw new Error("No items in cart");
      }

      if (!isCustomerInfoValid()) {
        throw new Error("Please provide valid contact information");
      }

      const result = await handlePurchaseOrder(items, total);

      if (!result.data) {
        throw new Error(result.error || "Failed to create order");
      }

      const orderId = result.data.id;
      const formattedPhone = formatPhoneNumber(customerInfo.phone);

      const orderDetails = {
        id: orderId,
        display_id: `ORD${String(orderId).padStart(6, '0')}`,
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

      // Show success message with order ID
      toast.success(`Order ${orderDetails.display_id} created successfully!`, {
        description: "You will receive a confirmation message shortly.",
      });

      // Send WhatsApp notification
      sendWhatsAppOrderNotification(orderDetails).catch((err: Error) => {
        console.error("Failed to send WhatsApp notification:", err.message);
        toast.error("Order placed successfully, but failed to send notification to admin.");
      });

      // Clear cart and close dialog
      clearCart();
      onClose();

      // Refresh the page to reflect changes
      router.refresh();
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(error instanceof Error ? error.message : "Failed to place order");
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
          Please provide your contact information for delivery.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
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

      <DialogFooter className="flex sm:justify-between gap-4 sm:gap-0">
        <Button variant="outline" onClick={() => setCurrentStep('review')}>
          Back to Review
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isSubmitting || !isCustomerInfoValid()}
        >
          {isSubmitting ? "Processing..." : "Confirm Order"}
        </Button>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {currentStep === 'review' ? renderReviewStep() : renderDetailsStep()}
      </DialogContent>
    </Dialog>
  );
};
