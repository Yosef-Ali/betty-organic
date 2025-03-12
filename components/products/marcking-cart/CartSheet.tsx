'use client';

import { useState } from 'react';
import { useMarketingCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { SharePopup } from './SharePopup';
import { CartItem } from './CartItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ConfirmPurchaseDialog } from './ConfirmPurchaseDialog';

import { CartItem as CartItemType } from '@/types/cart';

interface CartSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartSheet = ({ isOpen, onOpenChange }: CartSheetProps) => {
  const { items } = useMarketingCartStore();
  const { clearCart } = useMarketingCartStore();
  const { setCartOpen } = useUIStore();
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  const totalAmount = items.reduce(
    (total, item) => total + item.pricePerKg * (item.grams / 1000),
    0,
  );

  // Handle purchase dialog closing
  const handlePurchaseDialogChange = (open: boolean) => {
    setIsPurchaseDialogOpen(open);
    if (!open) {
      // If purchase dialog is closing, also close the cart sheet
      onOpenChange(false);
      // Make sure chat is visible again
      setCartOpen(false);
    }
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        setCartOpen(open);
      }}>
        {/* <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="h-4 w-4" />
            {items.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                {items.length}
              </span>
            )}
          </Button>
        </SheetTrigger> */}
        <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg z-50">
          <SheetHeader>
            <SheetTitle>Shopping Cart ({items?.length})</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 pr-6">
            {items?.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {items?.map(item => (
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
                  Order Now
                </Button>
                <SharePopup />
              </div>
              <Button
                variant="destructive"
                className="w-full mt-2"
                onClick={() => {
                  clearCart();
                  onOpenChange(false);
                  setCartOpen(false);
                }}
              >
                Clear Cart
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmPurchaseDialog
        open={isPurchaseDialogOpen}
        onOpenChange={handlePurchaseDialogChange}
        items={items}
        total={totalAmount}
      />
    </>
  );
};
