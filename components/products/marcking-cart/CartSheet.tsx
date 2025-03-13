'use client';

import { useState, useEffect } from 'react';
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
import { ConfirmPurchaseDialog } from './ConfirmPurchaseDialog';

interface CartSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CartSheet = ({ isOpen, onOpenChange }: CartSheetProps) => {
  const store = useMarketingCartStore();
  const items = store?.items ?? [];
  const clearCart = store?.clearCart;
  const { setCartOpen } = useUIStore();
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const totalAmount = items?.reduce(
    (total, item) => total + (item.pricePerKg * (item.grams / 1000)),
    0,
  ) ?? 0;

  // Handle purchase dialog closing
  const handlePurchaseDialogChange = (open: boolean) => {
    setIsPurchaseDialogOpen(open);
    if (!open) {
      onOpenChange(false);
      setCartOpen(false);
    }
  };

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        setCartOpen(open);
      }}>
        <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg z-50">
          <SheetHeader>
            <SheetTitle>Shopping Cart ({items?.length ?? 0})</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 pr-6">
            {!items?.length ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground">Your cart is empty</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {items.map(item => (
                  <div key={item.id}>
                    <CartItem item={item} />
                    <Separator />
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          {items?.length > 0 && (
            <div className="flex flex-col space-y-4 pr-6 pt-6">
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
                    if (clearCart) {
                      clearCart();
                      onOpenChange(false);
                      setCartOpen(false);
                    }
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
        open={isPurchaseDialogOpen}
        onOpenChange={handlePurchaseDialogChange}
        items={items}
        total={totalAmount}
      />
    </>
  );
};
