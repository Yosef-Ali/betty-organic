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
import { ChevronLeft } from "lucide-react";
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
    setIsThermalPrintPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
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
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("customerId", "DEFAULT_CUSTOMER_ID");
      formData.append("status", orderStatus);

      // Determine the order type based on the current path
      const orderType = pathname.includes('/dashboard/sales') ? 'store' : 'online';
      console.log("Order Type:", orderType); // Console log for order type
      console.log("Current Path:", pathname); // Console log for current path
      formData.append("type", orderType);

      formData.append("items", JSON.stringify(items.map(item => ({
        productId: item.id,
        quantity: item.grams / 1000,
        price: (item.pricePerKg * item.grams) / 1000,
      }))));
      formData.append("customerInfo", customerInfo);

      const order = await createOrder(formData);
      clearCart();
      onOpenChange(false);
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
          <SheetHeader className="relative flex flex-row items-center justify-start space-x-4">
            <div className="flex items-center space-x-4">
              {isOrderConfirmed && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleBackToCart}
                  className="h-8 w-8 flex items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Back</span>
                </Button>
              )}
              <SheetTitle className="text-2xl m-0 flex items-center">
                {isOrderConfirmed ? "Order Confirmed" : "Your Cart"}
              </SheetTitle>
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
                  onCancel={() => { }}
                  onThermalPrintPreview={handleThermalPrintPreview}
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
