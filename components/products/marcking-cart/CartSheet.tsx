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
  SheetClose,
} from '@/components/ui/sheet';
import { X, User } from 'lucide-react';
import { CartItem } from './CartItem';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ConfirmPurchaseDialog } from './dialog';
import { ContactDeliveryDialog } from '@/components/ContactDeliveryDialog';

interface CartSheetProps {
  isOpen: boolean;
  onOpenChangeAction: (open: boolean) => void;
}

export const CartSheet = ({ isOpen, onOpenChangeAction = () => { } }: CartSheetProps) => {
  const { items, getTotalAmount } = useMarketingCartStore();
  const { clearCart } = useMarketingCartStore();
  const { setCartOpen } = useUIStore();
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  // Contact & Delivery state
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const totalAmount = getTotalAmount();

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
        // When Sheet is being closed (open is false), ensure both state handlers are called
        if (typeof onOpenChangeAction === 'function') {
          onOpenChangeAction(open);
        } else {
          // If onOpenChangeAction is not provided, just use setCartOpen
          // Handle gracefully without logging
        }
        setCartOpen(open);
      }}>
        <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg z-50 bg-background text-foreground">
          <SheetHeader>
            <SheetTitle>Shopping Cart ({items?.length})</SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1 pr-6">
            {items?.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-muted-foreground dark:text-muted-foreground">Your cart is empty</p>
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
              {/* Contact & Delivery Button */}
              <Button
                variant="outline"
                onClick={() => setIsContactDialogOpen(true)}
                className="w-full flex items-center gap-2 h-12 border-border hover:bg-accent hover:text-accent-foreground"
              >
                <User className="w-4 h-4" />
                Contact & Delivery Details
                {customerInfo.phone && customerInfo.address ? (
                  <span className="ml-auto text-xs text-green-600 dark:text-green-400 font-medium">✓ Complete</span>
                ) : (
                  <span className="ml-auto text-xs text-orange-600 dark:text-orange-400">⚠ Required</span>
                )}
              </Button>

              {/* Improved Total Amount Section */}
              <div className="bg-muted/30 dark:bg-muted/20 p-4 rounded-md border border-border/50">
                <div className="flex items-center">
                  <span className="text-base font-semibold mr-auto text-foreground">Total Amount</span>
                  <span className="text-xl font-bold pl-4 text-foreground">
                    ETB {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-center">
                <Button
                  className="w-full flex-1 mr-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setIsPurchaseDialogOpen(true)}
                >
                  Order Now
                </Button>
                <Button
                  variant="destructive"
                  className="flex-none bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  size="sm"
                  onClick={() => {
                    clearCart();
                    // Safely call onOpenChangeAction to avoid the "not a function" error
                    if (typeof onOpenChangeAction === 'function') {
                      onOpenChangeAction(false);
                    }
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
        customerInfo={customerInfo}
      />

      <ContactDeliveryDialog
        isOpen={isContactDialogOpen}
        onOpenChangeAction={setIsContactDialogOpen}
        customerInfo={customerInfo}
        onCustomerInfoChangeAction={setCustomerInfo}
      />
    </>
  );
};
