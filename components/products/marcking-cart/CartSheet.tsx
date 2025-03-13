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
  const removeFromCart = store?.removeFromCart;
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
  const handlePurchaseDialogClose = () => {
    setIsPurchaseDialogOpen(false);
    onOpenChange(false);
    setCartOpen(false);
  };

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
          <SheetHeader className="space-y-0 pb-4">
            <SheetTitle>Shopping Cart</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            {items?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Your cart is empty</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                    <div>
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {item.grams}g - ETB {((item.pricePerKg * item.grams) / 1000).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (removeFromCart) {
                          removeFromCart(item.id);
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
        isOpen={isPurchaseDialogOpen}
        onClose={handlePurchaseDialogClose}
        items={items}
        total={totalAmount}
      />
    </>
  );
};
