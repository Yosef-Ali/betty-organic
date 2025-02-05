import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
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
import { ChevronLeftIcon } from 'lucide-react';
import { OtpDialog } from './OtpDialog';
import ConfirmDialog from './ConfirmDialog';
import { CartItems } from './CartItems';
import { OrderSummary } from './OrderSummary';
import { useSalesCartSheet } from './useSalesCartSheet';
import { Order } from '@/types/order';

interface SalesCartSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreate: (orderData: Order) => Promise<boolean>;
}

export const SalesCartSheet: React.FC<SalesCartSheetProps> = ({
  isOpen,
  onOpenChange,
  onOrderCreate,
}) => {
  // Custom hook for main functionality
  const {
    profile,
    error,
    isLoading,
    items,
    customer,
    setCustomer,
    orderStatus,
    setOrderStatus,
    isThermalPrintPreviewOpen,
    isOrderConfirmed,
    isSaving,
    isStatusVerified = false,
    isOtpDialogOpen,
    otp,
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
    setIsOtpDialogOpen,
  } = useSalesCartSheet({
    onOpenChange,
    onOrderCreate,
  });

  // Local state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'save' | 'cancel' | null>(
    null,
  );
  const [isPending, setIsPending] = useState(false);

  // Cleanup effect
  useEffect(() => {
    return () => {
      setIsConfirmDialogOpen(false);
      setConfirmAction(null);
      setIsPending(false);
    };
  }, []);

  // Handle customer updates
  const handleCustomerUpdate = useCallback(
    (id: string) => {
      setCustomer(prev => ({ ...prev, id }));
    },
    [setCustomer],
  );

  // Handle status toggle with proper state management
  const handleToggleLockStatus = useCallback(() => {
    if (profile?.role === 'admin' && !isPending) {
      setIsPending(true);
      setOrderStatus(prevStatus => {
        const newStatus =
          prevStatus === 'processing' ? 'pending' : 'processing';
        return newStatus;
      });
    }
  }, [profile?.role, setOrderStatus, isPending]);

  // Effect to handle pending state
  useEffect(() => {
    if (isPending) {
      const timer = setTimeout(() => {
        setIsPending(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPending]);

  // Handle confirm dialog changes safely
  const handleConfirmDialogChange = useCallback(
    async (action: 'save' | 'cancel', selectedCustomer?: any) => {
      if (isPending) return;

      setIsPending(true);

      try {
        if (action === 'save') {
          if (!selectedCustomer?.id) {
            toast.error('Please select a customer before saving the order');
            return;
          }
          setConfirmAction(action);
          await handleConfirmDialog('save', selectedCustomer);
        } else {
          setConfirmAction(action);
          setIsConfirmDialogOpen(true);
        }
      } finally {
        setIsPending(false);
      }
    },
    [handleConfirmDialog, isPending],
  );

  // Error handling
  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">
          Failed to load profile. Please try again.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange} modal={false}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col h-full">
          <SheetHeader className="space-y-0 pb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 p-0"
                disabled={isPending}
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
                <CartItems items={items} />
              ) : (
                <OrderSummary
                  items={items}
                  totalAmount={getTotalAmount()}
                  customerId={customer?.id || ''}
                  setCustomerId={handleCustomerUpdate}
                  orderStatus={orderStatus || 'pending'}
                  setOrderStatus={setOrderStatus}
                  isStatusVerified={isStatusVerified}
                  handleToggleLock={handleToggleLockStatus}
                  handleConfirmDialog={handleConfirmDialogChange}
                  isSaving={isSaving}
                  onPrintPreview={handleThermalPrintPreview}
                  isOrderSaved={isOrderSaved}
                  orderNumber={orderNumber}
                  isAdmin={profile?.role === 'admin'}
                  customerInfo={customer}
                  setCustomerInfo={setCustomer}
                  disabled={isPending}
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
            disabled={isPending}
          />
        </SheetContent>
      </Sheet>

      <AnimatePresence>
        {isThermalPrintPreviewOpen && (
          <PrintPreviewModal
            isOpen={isThermalPrintPreviewOpen}
            onClose={() => {
              if (!isPending) {
                setIsThermalPrintPreviewOpen(false);
              }
            }}
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

      {isConfirmDialogOpen && (
        <ConfirmDialog
          isConfirmDialogOpen={isConfirmDialogOpen}
          setIsConfirmDialogOpen={setIsConfirmDialogOpen}
          confirmAction={confirmAction || 'cancel'}
          handleConfirmAction={action => {
            if (!isPending) {
              handleConfirmAction(action);
              setIsConfirmDialogOpen(false);
            }
          }}
        />
      )}

      <OtpDialog
        isOpen={isOtpDialogOpen}
        onOpenChange={value => {
          if (!isPending) {
            setIsOtpDialogOpen(value);
          }
        }}
        otp={otp}
        handleOtpChange={onOtpChange}
        handleOtpSubmit={handleOtpSubmit}
      />
    </>
  );
};
