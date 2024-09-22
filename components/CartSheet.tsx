"use client";
import { FC, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCartStore } from "@/store/cartStore";
import { CartItems } from "./CartItems";
import { OrderSummary } from "./OrderSummary";
import { CartFooter } from "./CartFooter";
import { PrintPreviewModal } from "./PrintPreviewModal";
import { ConfirmDialog } from "./ConfirmDialog";
import { OtpDialog } from "./OtpDialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export interface CartSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartSheet: FC<CartSheetProps> = ({ isOpen, onOpenChange }) => {
  const { items, clearCart } = useCartStore();
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [isThermalPrintPreviewOpen, setIsThermalPrintPreviewOpen] =
    useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"save" | "cancel" | null>(
    null,
  );
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);

  const handleBackToCart = () => {
    setIsOrderConfirmed(false);
  };

  const handleConfirmOrder = () => {
    setIsOrderConfirmed(true);
  };

  const handleConfirmDialog = (action: "save" | "cancel") => {
    setConfirmAction(action);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction === "save") {
      // Handle save order
    } else {
      handleBackToCart();
    }
    setIsConfirmDialogOpen(false);
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
                {!isOrderConfirmed ? (
                  <CartItems />
                ) : (
                  <OrderSummary onConfirmDialog={handleConfirmDialog} />
                )}
              </ScrollArea>
              {!isOrderConfirmed && items.length > 0 && (
                <CartFooter
                  onConfirmOrder={handleConfirmOrder}
                  onThermalPrintPreview={() =>
                    setIsThermalPrintPreviewOpen(true)
                  }
                />
              )}
            </CardContent>
          </Card>
        </SheetContent>
      </Sheet>
      <PrintPreviewModal
        isOpen={isThermalPrintPreviewOpen}
        onClose={() => setIsThermalPrintPreviewOpen(false)}
        items={items}
      />
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        onOpenChange={setIsConfirmDialogOpen}
        onConfirm={handleConfirmAction}
        action={confirmAction}
      />
      <OtpDialog isOpen={isOtpDialogOpen} onOpenChange={setIsOtpDialogOpen} />
    </>
  );
};
