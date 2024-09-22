"use client";

import { FC, useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartItem } from "./CartItem";
import { CartFooter } from "./CartFooter";
import { PrintPreviewModal } from "../PrintPreviewModal";
import { createOrder } from "@/app/actions/orderActions";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Printer, Lock, Unlock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export interface CartSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartSheet: FC<CartSheetProps> = ({ isOpen, onOpenChange }) => {
  const { items, removeFromCart, updateGrams, clearCart } = useCartStore();
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
      formData.append("customerId", "DEFAULT_CUSTOMER_ID"); // We'll use the default customer ID
      formData.append("status", orderStatus);
      formData.append("type", "online");
      formData.append("items", JSON.stringify(items.map(item => ({
        productId: item.id,
        quantity: item.grams / 1000,
        price: (item.pricePerKg * item.grams) / 1000,
      }))));
      formData.append("customerInfo", customerInfo); // Add customer info to formData

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
      setOtp(["", "", "", ""]);  // Clear OTP inputs after verification
    } else {
      // Handle incorrect OTP
      alert("Incorrect OTP. Please try again.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move focus to the next input
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
                  {!isOrderConfirmed && (
                    <motion.div
                      key="cart-items"
                      initial={{ opacity: 0, x: "-100%" }}
                      animate={{ opacity: 1, x: "0%" }}
                      exit={{ opacity: 0, x: "100%" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="space-y-4"
                    >
                      {items.map((item, index) => (
                        <CartItem
                          key={item.id}
                          item={item}
                          index={index}
                          updateGrams={updateGrams}
                          removeFromCart={removeFromCart}
                          isLastItem={index === items.length - 1}
                        />
                      ))}
                    </motion.div>
                  )}
                  {isOrderConfirmed && (
                    <motion.div
                      key="order-summary"
                      initial={{ opacity: 0, x: "100%" }}
                      animate={{ opacity: 1, x: "0%" }}
                      exit={{ opacity: 0, x: "-100%" }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      className="space-y-4"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-lg">Order Summary</h3>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-2" />
                            Print
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleThermalPrintPreview}>
                            Thermal
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 mb-4">
                        {items.map((item) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span>{item.name} ({item.grams}g)</span>
                            <span>${((item.pricePerKg * item.grams) / 1000).toFixed(2)}</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold">
                          <span>Total:</span>
                          <span>${getTotalAmount().toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="customer-info" className="text-sm font-medium">
                            Customer Name or Phone (Optional)
                          </Label>
                          <Input
                            id="customer-info"
                            type="text"
                            placeholder="Enter customer name or phone"
                            value={customerInfo}
                            onChange={(e) => setCustomerInfo(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-grow">
                            <Label htmlFor="order-status" className="text-sm font-medium">
                              Order Status
                            </Label>
                            <Select
                              value={orderStatus}
                              onValueChange={setOrderStatus}
                              disabled={!isStatusVerified}
                            >
                              <SelectTrigger id="order-status" className="mt-1">
                                <SelectValue placeholder="Select order status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="credit">Credit</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            className="mt-6"
                            onClick={handleToggleLock}
                            disabled={hasToggledLock && !isStatusVerified}
                          >
                            {isStatusVerified ? (
                              <Unlock className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => handleConfirmDialog("cancel")}>
                          Cancel
                        </Button>
                        <Button onClick={() => handleConfirmDialog("save")} disabled={isSaving}>
                          {isSaving ? "Saving..." : "Save Order"}
                        </Button>
                      </div>
                    </motion.div>
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
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction === "save" ? "Confirm Save Order" : "Confirm Cancel Order"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction === "save"
                ? "Are you sure you want to save this order? This action cannot be undone."
                : "Are you sure you want to cancel this order? All changes will be lost."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog open={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter OTP to Verify</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center space-x-2 my-4">
            {[0, 1, 2, 3].map((index) => (
              <Input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength={1}
                className="w-12 text-center"
                value={otp[index]}
                onChange={(e) => handleOtpChange(index, e.target.value)}
              />
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleOtpSubmit}>Verify</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog >
    </>
  );
};