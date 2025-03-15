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
import { useSalesCartStore } from '@/store/salesCartStore';

interface SalesCartSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreate: (orderData: Order) => Promise<boolean>;
  user?: {
    id: string;
    user_metadata: {
      full_name?: string;
    };
    email?: string;
    profile: {
      id: string;
      role: string;
    };
  };
}

export const SalesCartSheet: React.FC<SalesCartSheetProps> = ({
  isOpen,
  onOpenChange,
  onOrderCreate,
  user,
}) => {
  const { clearCart } = useSalesCartStore();

  const {
    profile = user?.profile ? {
      id: user.profile.id || user.id,
      role: user.profile.role,
      name: user.user_metadata?.full_name || '',
      email: user.email
    } : null,
    error,
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
    user,
  });

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'save' | 'cancel' | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    return () => {
      setIsConfirmDialogOpen(false);
      setConfirmAction(null);
      setIsPending(false);
    };
  }, []);

  const handleCustomerUpdate = useCallback((id: string) => {
    try {
      if (!id) return;
      setCustomer({ ...customer, id });
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer information');
    }
  }, [customer, setCustomer, toast]);

  const handleToggleLockStatus = useCallback(() => {
    if (profile?.role === 'admin' && !isPending) {
      setIsPending(true);
      const newStatus = orderStatus === 'processing' ? 'pending' : 'processing';
      setOrderStatus(newStatus);
    }
  }, [profile?.role, isPending, orderStatus, setOrderStatus]);

  useEffect(() => {
    if (isPending) {
      const timer = setTimeout(() => {
        setIsPending(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPending]);

  const handleConfirmDialogChange = useCallback(
    async (action: 'save' | 'cancel', selectedCustomer?: any) => {
      if (isPending) return;

      try {
        if (action === 'save') {
          if (!selectedCustomer?.id) {
            toast.error('Please select a customer before saving the order');
            return;
          }
          setConfirmAction('save');
          await handleConfirmDialog('save', selectedCustomer);
        } else {
          setConfirmAction('cancel');
          setIsConfirmDialogOpen(true);
        }
      } catch (error) {
        console.error('Error in handleConfirmDialogChange:', error);
        toast.error('Failed to process the action. Please try again.');
      }
    },
    [handleConfirmDialog, isPending],
  );

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <div className="h-6 w-6 text-destructive" />
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold tracking-tight">Error Loading Profile</h3>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Failed to load profile. Please try again.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col h-full">
          <SheetHeader className="space-y-0 pb-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseCart}
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
                <>
                  {console.log('Profile being passed to OrderSummary:', profile)}
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
                    profile={profile ? {
                      id: profile.id,
                      role: profile.role,
                      name: profile.name,
                      email: profile.email
                    } : undefined}
                  />
                </>
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

