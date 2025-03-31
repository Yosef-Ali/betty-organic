import { FC } from 'react';
import { Order } from '@/types/order';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CartFooter } from './CartFooter';
import { PrintPreviewModal } from '../PrintPreviewModal';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeftIcon } from 'lucide-react';
import { OtpDialog } from './OtpDialog';
import ConfirmDialog from './ConfirmDialog';
import { CartItems } from './CartItems';
import { OrderSummary } from './OrderSummary';
import { useCartSheet } from './useCartSheet';
import { Customer } from '@/types/customer';
import { useAuth } from '@/components/providers/AuthProvider'; // Import useAuth here as well

export interface CartSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Note: CartSheetHeader component seems unused in this file, keeping for context if needed elsewhere.
const CartSheetHeader: FC<{ onClose: () => void }> = ({ onClose }) => (
  <SheetHeader className="space-y-0 pb-4">
    <div className="flex items-center justify-between">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-8 w-8 p-0"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </Button>
      <SheetTitle>Shopping Cart</SheetTitle>
      <div className="w-8" />
    </div>
  </SheetHeader>
);

export const CartSheet: FC<CartSheetProps> = ({ isOpen, onOpenChange }) => {
  // Get auth context here to determine isAdmin and pass profile
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const {
    items,
    customer,
    setCustomer, // Keep the original setter from the hook
    orderStatus,
    setOrderStatus,
    isThermalPrintPreviewOpen,
    isOrderConfirmed,
    isSaving,
    isConfirmDialogOpen,
    confirmAction,
    // isStatusVerified removed from destructuring
    isOtpDialogOpen,
    otp,
    hasToggledLock,
    isOrderSaved,
    orderNumber,
    getTotalAmount,
    onOtpChange,
    handleOtpSubmit,
    handleThermalPrintPreview,
    handlePrint,
    handleShare,
    handleConfirmOrder,
    handleBackToCart,
    handleSaveOrder,
    handleCloseCart,
    handleConfirmDialog,
    handleConfirmAction,
    setIsThermalPrintPreviewOpen,
    setIsConfirmDialogOpen,
    setIsOtpDialogOpen,
  } = useCartSheet(onOpenChange);

  // Wrapper function for setCustomerInfo prop, matching OrderSummary's expectation
  const handleSetCustomerInfo = (info: { id?: string; name?: string; email?: string }) => {
    setCustomer(prevCustomer => ({
      ...prevCustomer, // Keep existing partial customer data
      ...info,       // Update with new info (id, name, email)
    }));
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
          {/* Using handleCloseCart for the back button */}
          <SheetHeader className="space-y-0 pb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseCart} // Use handleCloseCart for consistent behavior
                className="h-8 w-8 p-0"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <SheetTitle>Shopping Cart</SheetTitle>
              <div className="w-8" /> {/* Spacer */}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              {!isOrderConfirmed ? (
                <>
                  <CartItems items={items} />
                </>
              ) : (
                <OrderSummary
                  items={items}
                  totalAmount={getTotalAmount()}
                  customerId={customer?.id || ''}
                  // Pass function to set only the ID part of the customer state
                  setCustomerId={id => setCustomer(prev => ({ ...prev, id }))}
                  orderStatus={orderStatus}
                  setOrderStatus={setOrderStatus}
                  // isStatusVerified prop removed
                  handleToggleLock={() =>
                    setOrderStatus(
                      orderStatus === 'processing' ? 'pending' : 'processing',
                    )
                  }
                  handleConfirmDialog={handleConfirmDialog}
                  isSaving={isSaving}
                  onPrintPreview={handleThermalPrintPreview}
                  isOrderSaved={isOrderSaved}
                  orderNumber={orderNumber}
                  customerInfo={customer} // Pass the customer state object
                  setCustomerInfo={handleSetCustomerInfo} // Pass the wrapper function
                  isAdmin={isAdmin} // Pass isAdmin derived from auth context
                  // Fix: Pass profile as undefined if it's null to match expected type
                  profile={profile || undefined}
                />
              )}
            </ScrollArea>
          </div>

          <CartFooter
            getTotalAmount={getTotalAmount}
            isPrintPreview={isThermalPrintPreviewOpen}
            onPrintPreview={handleThermalPrintPreview}
            onPrint={handlePrint}
            onShare={handleShare}
            onConfirmOrder={handleConfirmOrder}
            isOrderConfirmed={isOrderConfirmed}
            onCancel={handleBackToCart} // Use handleBackToCart when order is confirmed
          />
        </SheetContent>
      </Sheet>

      <AnimatePresence>
        {isThermalPrintPreviewOpen && (
          <PrintPreviewModal
            isOpen={isThermalPrintPreviewOpen}
            onClose={() => setIsThermalPrintPreviewOpen(false)}
            items={items.map(item => ({
              name: item.name,
              quantity: item.grams / 1000, // Assuming quantity is in kg for preview
              price: (item.pricePerKg * item.grams) / 1000,
            }))}
            total={getTotalAmount()}
            customerId={customer?.id || ''}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        isConfirmDialogOpen={isConfirmDialogOpen}
        setIsConfirmDialogOpen={setIsConfirmDialogOpen}
        confirmAction={confirmAction}
        handleConfirmAction={handleConfirmAction}
      />

      <OtpDialog
        isOpen={isOtpDialogOpen}
        onOpenChange={setIsOtpDialogOpen}
        otp={otp}
        handleOtpChange={onOtpChange}
        handleOtpSubmit={handleOtpSubmit}
      />
    </>
  );
};
