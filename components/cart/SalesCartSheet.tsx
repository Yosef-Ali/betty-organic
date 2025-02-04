import { FC, useEffect, useState, useCallback } from 'react';
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
import { getCurrentUser } from '@/app/actions/auth';
import { Profile } from '@/lib/types/auth';
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);
  const [confirmAction, setConfirmAction] = useState<'save' | 'cancel' | null>(
    null,
  );

  const {
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
    setIsOtpDialogOpen,
  } = useSalesCartSheet({
    profile,
    onOpenChange,
    onOrderCreate,
  });

  const handleConfirmDialogChange = useCallback(
    (action: 'save' | 'cancel', selectedCustomer?: any) => {
      console.log('Confirm dialog with:', { action, selectedCustomer });
      setConfirmAction(action);

      if (action === 'save') {
        if (!selectedCustomer?.id) {
          toast.error('Please select a customer before saving the order');
          return;
        }
        handleConfirmDialog('save', selectedCustomer);
      } else {
        setIsConfirmDialogOpen(true);
      }
    },
    [handleConfirmDialog],
  );

  // Remove the problematic useEffect

  const handleToggleLockStatus = useCallback(() => {
    if (profile?.role === 'admin') {
      setOrderStatus(isStatusVerified ? 'pending' : 'processing');
    }
  }, [profile?.role, isStatusVerified, setOrderStatus]);

  useEffect(() => {
    const fetchProfile = async () => {
      console.log('Fetching profile...');
      try {
        const authData = await getCurrentUser();
        if (!authData?.profile) {
          throw new Error('Profile not found');
        }
        const userProfile = authData.profile;
        if (!userProfile) {
          throw new Error('Profile not found');
        }
        if (!userProfile.id) {
          throw new Error('Profile ID not found');
        }
        setProfile(userProfile);
        setError(null);
        console.log('Fetched profile:', userProfile);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError(
          error instanceof Error ? error : new Error('Failed to fetch profile'),
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    console.log('Profile updated:', profile);
  }, [profile]);

  useEffect(() => {
    console.log('Customer updated:', customer);
  }, [customer]);

  if (error) {
    console.error('Profile load error:', error);
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">
          Failed to load profile. Please try again.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>Loading...</p>
      </div>
    );
  }

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
                <CartItems items={items} />
              ) : (
                <OrderSummary
                  items={items}
                  totalAmount={getTotalAmount()}
                  customerId={customer?.id || ''}
                  setCustomerId={(id: string) =>
                    setCustomer({ ...customer, id })
                  }
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
        confirmAction={confirmAction || 'cancel'}
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
