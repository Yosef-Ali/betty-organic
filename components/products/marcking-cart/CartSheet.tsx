"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SharePopup } from "./SharePopup";
import { CartItem } from "./CartItem";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ConfirmPurchaseDialog } from "./ConfirmPurchaseDialog";

export function CartSheet() {
  const { items } = useCartStore();
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  const totalAmount = items.reduce(
    (total, item) => total + item.pricePerKg * (item.grams / 1000),
    0
  );

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-4 w-4" />
            {items.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {items.length}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg z-50">
          <SheetHeader>
            <SheetTitle>Shopping Cart ({items.length})</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 pr-6">
            {items.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {items.map((item) => (
                  <div key={item.id}>
                    <CartItem item={item} />
                    <Separator />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {items.length > 0 && (
            <div className="space-y-4 pr-6 pt-6">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Total Amount</span>
                <span className="text-lg font-bold">
                  ETB {totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <Button
                  className="flex-1"
                  onClick={() => setIsPurchaseDialogOpen(true)}
                >
                  Purchase Now
                </Button>
                <SharePopup />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmPurchaseDialog
        open={isPurchaseDialogOpen}
        onOpenChange={setIsPurchaseDialogOpen}
        items={items}
        total={totalAmount}
      />
    </>
  );
}
