import { FC, useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { usePathname } from 'next/navigation'; // Change this import
import { createOrder } from "@/app/actions/orderActions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartFooter } from "./CartFooter";
import { PrintPreviewModal } from "../PrintPreviewModal";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, X, Share2 } from "lucide-react"; // Update import to use just ChevronLeftIcon and add Share2 icon import
import { OtpDialog } from "./OtpDialog";
import ConfirmDialog from "./ConfirmDialog";
import { CartItems } from "./CartItems";
import { OrderSummary } from "./OrderSummary";

export interface CartSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartSheet: FC<CartSheetProps> = ({ isOpen, onOpenChange }) => {
  const { items, clearCart } = useCartStore();
  const [customerInfo, setCustomerInfo] = useState("");
  const [orderStatus, setOrderStatus] = useState("paid");
  const [isThermalPrintPreviewOpen, setIsThermalPrintPreviewOpen] = useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"save" | "cancel" | null>(null);
  const [isStatusVerified, setIsStatusVerified] = useState(false);
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [hasToggledLock, setHasToggledLock] = useState(false);
  const [isOrderSaved, setIsOrderSaved] = useState(false); // NEW STATE

  const pathname = usePathname(); // Use pathname instead of searchParams

  useEffect(() => {
    if (items.length === 0) {
      setIsOrderConfirmed(false);
      setIsStatusVerified(false);
      setHasToggledLock(false);
    }
  }, [items]);

  const getTotalAmount = () => {
    return items.reduce(
      (total, item) => total + (item.pricePerKg * item.grams) / 1000,
      0
    );
  };

  const handleThermalPrintPreview = () => {
    setIsThermalPrintPreviewOpen(true); // opens the PrintPreviewModal
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      const orderDetails = items.map(item =>
        `${item.name} (${item.grams}g): Br ${((item.pricePerKg * item.grams) / 1000).toFixed(2)}`
      ).join('\n');

      const shareText = `*Betty Organic Order*\n\n${orderDetails}\n\n*Total: Br ${getTotalAmount().toFixed(2)}*`;

      // Try Web Share API first
      if (navigator.share) {
        await navigator.share({
          title: 'Betty Organic Order',
          text: shareText,
          url: window.location.href,
        });
      } else {
        // WhatsApp fallback
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleConfirmOrder = async () => {
    setIsOrderConfirmed(true);
  };

  const handleBackToCart = () => {
    setIsOrderConfirmed(false);
    setIsStatusVerified(false);
    setHasToggledLock(false);
  };

  const handleSaveOrder = async () => {
    const totalAmount = getTotalAmount();
    console.log(`Total amount before saving: ${totalAmount}`);
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("customerId", "DEFAULT_CUSTOMER_ID");
      formData.append("status", orderStatus);

      // Determine the order type based on the current path
      const orderType = pathname.includes('/dashboard/sales') ? 'store' : 'online';

      formData.append("type", orderType);
      formData.append("totalAmount", totalAmount.toString()); // Add totalAmount to formData

      formData.append("items", JSON.stringify(items.map(item => ({
        productId: item.id,
        quantity: item.grams,
        price: (item.pricePerKg * item.grams) / 1000,
      }))));
      formData.append("customerInfo", customerInfo);

      await createOrder(formData);
      clearCart();
      onOpenChange(false);

      setIsOrderSaved(true); // SET ORDER AS SAVED
    } catch (error) {
      console.error("Failed to save order:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsSaving(false);
    }
  };
  const handleConfirmDialog = (action: "save" | "cancel") => {
    setConfirmAction(action);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction === "save") {
      handleSaveOrder();
    } else {
      handleBackToCart();
    }
    setIsConfirmDialogOpen(false);
  };

  const handleOtpSubmit = () => {
    const enteredOtp = otp.join("");
    if (enteredOtp === "1111") {
      setIsStatusVerified(true);
      setIsOtpDialogOpen(false);
      setOtp(["", "", "", ""]);
    } else {
      alert("Incorrect OTP. Please try again.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value !== "" && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleToggleLock = () => {
    if (!hasToggledLock) {
      setIsOtpDialogOpen(true);
      setHasToggledLock(true);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
          <SheetHeader className="space-y-0 pb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => isOrderConfirmed ? handleBackToCart() : onOpenChange(false)}
                className="h-8 w-8 p-0 flex items-center justify-center"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
              <SheetTitle>{isOrderConfirmed ? 'Order Summary' : 'Your Cart'}</SheetTitle>
            </div>
          </SheetHeader>
          <Card className="flex-grow mt-4 border-0 shadow-none overflow-hidden flex flex-col">
            <CardContent className="p-0 flex-grow overflow-hidden flex flex-col">
              <ScrollArea className="flex-grow px-4">
                <AnimatePresence mode="wait">
                  {!isOrderConfirmed ? (
                    <CartItems items={items} />
                  ) : (
                    <OrderSummary
                      items={items}
                      totalAmount={getTotalAmount()}
                      customerInfo={customerInfo}
                      setCustomerInfo={setCustomerInfo}
                      orderStatus={orderStatus}
                      setOrderStatus={setOrderStatus}
                      isStatusVerified={isStatusVerified}
                      handleToggleLock={handleToggleLock}
                      handleConfirmDialog={handleConfirmDialog}
                      isSaving={isSaving}
                      onPrintPreview={handleThermalPrintPreview} // PASS THE NEW PROP HERE
                      isOrderSaved={isOrderSaved} // NEW PROP
                    />
                  )}
                </AnimatePresence>
              </ScrollArea>
              {!isOrderConfirmed && items.length > 0 && (
                <CartFooter
                  getTotalAmount={getTotalAmount}
                  isPrintPreview={false}
                  onPrintPreview={handlePrint}
                  onPrint={handlePrint}
                  onShare={handleShare}
                  onConfirmOrder={handleConfirmOrder}
                  isOrderConfirmed={isOrderConfirmed}
                />
              )}
            </CardContent>
          </Card>
        </SheetContent>
      </Sheet>
      <PrintPreviewModal
        isOpen={isThermalPrintPreviewOpen}
        onClose={() => setIsThermalPrintPreviewOpen(false)}
        items={items.map((item) => ({
          name: item.name,
          quantity: item.grams / 1000,
          price: (item.pricePerKg * item.grams) / 1000,
        }))}
        total={getTotalAmount()}
        customerInfo={customerInfo}
      />
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        confirmAction={confirmAction || "cancel"}
        onConfirmAction={handleConfirmAction}
      />
      <OtpDialog
        isOpen={isOtpDialogOpen}
        onOpenChange={setIsOtpDialogOpen}
        otp={otp}
        handleOtpChange={handleOtpChange}
        handleOtpSubmit={handleOtpSubmit}
      />
    </>
  );
};
