"use client";

import { FC, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CartItem as CartItemComponent } from "./CartItem";
import { CartFooter } from "./CartFooter";
import { PrintPreview } from "./PrintPreview";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThermalPrintComponent } from "./ThermalPrintComponent";
import { PrintPreviewModal } from "./PrintPreviewModal";
import { Button } from "@/components/ui/button";

export interface CartSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartSheet: FC<CartSheetProps> = ({ isOpen, onOpenChange }) => {
  const { items, removeFromCart, updateGrams } = useCartStore();
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isThermalPrintPreviewOpen, setIsThermalPrintPreviewOpen] =
    useState(false);

  const getTotalAmount = () => {
    return items.reduce(
      (total, item) => total + (item.pricePerKg * item.grams) / 1000,
      0,
    );
  };

  const handlePrintPreview = () => {
    setIsPrintPreview(true);
  };

  const handlePrint = () => {
    window.print();
    setIsPrintPreview(false);
  };

  const handleCancelPrint = () => {
    setIsPrintPreview(false);
  };

  const handleThermalPrintPreview = () => {
    setIsThermalPrintPreviewOpen(true);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg">
          <div className="flex flex-col h-full">
            <SheetHeader>
              <SheetTitle className="text-2xl">
                {isPrintPreview ? "Orders" : "Your Cart"}
              </SheetTitle>
            </SheetHeader>
            <Card className="flex-grow mt-4 border-0 shadow-none overflow-hidden">
              <CardContent className="p-0 h-full flex flex-col">
                <ScrollArea className="flex-grow px-4">
                  <div
                    className={`transition-all duration-300 ease-in-out ${isPrintPreview ? "h-0 opacity-0 overflow-hidden" : "h-auto opacity-100"}`}
                  >
                    {items.map((item, index) => (
                      <CartItemComponent
                        key={item.id}
                        item={item}
                        index={index}
                        updateGrams={updateGrams}
                        removeFromCart={removeFromCart}
                        isLastItem={index === items.length - 1}
                      />
                    ))}
                  </div>
                  <div
                    className={`transition-all duration-300 ease-in-out ${isPrintPreview ? "h-auto opacity-100" : "h-0 opacity-0 overflow-hidden"}`}
                  >
                    <div className="mb-4">
                      <Label
                        htmlFor="phone-number"
                        className="text-sm font-medium"
                      >
                        Phone Number (Optional)
                      </Label>
                      <Input
                        id="phone-number"
                        type="tel"
                        placeholder="Enter phone number"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <PrintPreview
                      items={items}
                      totalAmount={getTotalAmount()}
                      phoneNumber={phoneNumber}
                    />
                  </div>
                </ScrollArea>
                <CartFooter
                  getTotalAmount={getTotalAmount}
                  isPrintPreview={isPrintPreview}
                  onPrintPreview={handlePrintPreview}
                  onPrint={handlePrint}
                  onCancel={handleCancelPrint}
                  onThermalPrintPreview={handleThermalPrintPreview}
                />
              </CardContent>
            </Card>
          </div>
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
        phoneNumber={phoneNumber}
      />
      <ThermalPrintComponent
        items={items.map((item) => ({
          name: item.name,
          quantity: item.grams / 1000,
          price: (item.pricePerKg * item.grams) / 1000,
        }))}
        total={getTotalAmount()}
      />
    </>
  );
};
