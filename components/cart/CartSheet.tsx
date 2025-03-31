import { FC, useState } from 'react';
import { Order } from '@/types/order';
import { usePathname } from 'next/navigation';
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
import { useAuth } from '@/components/providers/AuthProvider';

export interface CartSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

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
  const { user, profile } = useAuth();
  const pathname = usePathname();
  const isAdmin = profile?.role === 'admin';
  const isGuestFlow = pathname === '/' && !user;

  // Guest information state
  const [guestName, setGuestName] = useState('');
  const [guestLocation, setGuestLocation] = useState('');
  const [guestPhone, setGuestPhone] = useState('+251'); // Initialize with country code

  const {
    items,
    customer,
    setCustomer,
    orderStatus,
    setOrderStatus,
    isThermalPrintPreviewOpen,
    isOrderConfirmed,
    isSaving,
    isConfirmDialogOpen,
    confirmAction,
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
    handleGuestOrderConfirmation,
    handleCloseCart,
    handleConfirmDialog,
    handleConfirmAction,
    setIsThermalPrintPreviewOpen,
    setIsConfirmDialogOpen,
    setIsOtpDialogOpen,
  } = useCartSheet(onOpenChange);

  const handleSetCustomerInfo = (info: { id?: string; name?: string; email?: string }) => {
    setCustomer(prevCustomer => ({
      ...prevCustomer,
      ...info,
    }));
  };

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
          <SheetHeader className="space-y-0 pb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseCart}
                className="h-8 w-8 p-0"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <SheetTitle>Shopping Cart</SheetTitle>
              <div className="w-8" />
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
                  setCustomerId={id => setCustomer(prev => ({ ...prev, id }))}
                  orderStatus={orderStatus}
                  setOrderStatus={setOrderStatus}
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
                  customerInfo={customer}
                  setCustomerInfo={handleSetCustomerInfo}
                  isAdmin={isAdmin}
                  profile={profile || undefined}
                  // Pass all guest props
                  isGuestFlow={isGuestFlow}
                  guestName={guestName}
                  setGuestName={setGuestName}
                  guestLocation={guestLocation}
                  setGuestLocation={setGuestLocation}
                  guestPhone={guestPhone}
                  setGuestPhone={setGuestPhone}
                  onGuestOrderConfirm={() =>
                    handleGuestOrderConfirmation({ name: guestName, location: guestLocation, phone: guestPhone })
                  }
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
            onCancel={handleBackToCart}
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
              quantity: item.grams / 1000,
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
