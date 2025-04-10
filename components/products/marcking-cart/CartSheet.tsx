'use client';

import { useState } from 'react';
import { useMarketingCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CartItem } from './CartItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ConfirmPurchaseDialogNew } from './ConfirmPurchaseDialogNew';
import { ConfirmPurchaseDialog } from './dialog';

interface CartSheetProps {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export const CartSheet = ({ isOpen, onOpenChangeAction }: CartSheetProps) => {
  const { items } = useMarketingCartStore();
  const { clearCart } = useMarketingCartStore();
  const { setCartOpen } = useUIStore();
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);

  const totalAmount = items.reduce(
    (total, item) => total + item.pricePerKg * (item.grams / 1000),
    0,
  );

  // Handle purchase dialog closing
  const handlePurchaseDialogClose = () => {
    // Close the purchase dialog
    setIsPurchaseDialogOpen(false);

    // Make sure onOpenChangeAction is called safely
    if (typeof onOpenChangeAction === 'function') {
      onOpenChangeAction(false);
    }

    // Always close the cart regardless
    setCartOpen(false);
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => {
        onOpenChangeAction(open);
        setCartOpen(open);
      }}>
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
            <div className="flex flex-col space-y-4 pr-6 pt-6">
              {/* Improved Total Amount Section */}
              <div className="bg-muted/30 p-4 rounded-md">
                <div className="flex items-center">
                  <span className="text-base font-semibold mr-auto">Total Amount</span>
                  <span className="text-xl font-bold pl-4">
                    ETB {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <Button
                  className="w-full flex-1 mr-2"
                  onClick={() => setIsPurchaseDialogOpen(true)}
                >
                  Order Now
                </Button>
                <Button
                  variant="destructive"
                  className="flex-none"
                  size="sm"
                  onClick={() => {
                    clearCart();
                    onOpenChangeAction(false);
                    setCartOpen(false);
                  }}
                >
                  Clear Cart
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmPurchaseDialog
        isOpen={isPurchaseDialogOpen}
        onCloseAction={handlePurchaseDialogClose}
        items={items}
        total={totalAmount}
      />
    </>
  );
};
