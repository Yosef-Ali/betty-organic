import { useState, useEffect } from 'react';
import { useSalesCartStore } from '@/store/salesCartStore';
import { usePathname } from 'next/navigation';
import { createOrder } from '@/app/actions/orderActions';
import { Order } from '@/types/order';
import { Customer } from '@/types/customer';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/hooks/useUser';

interface Profile {
  id: string;
  name: string;
  role: string;
}

interface UseSalesCartSheetProps {
  onOpenChange: (open: boolean) => void;
  onOrderCreate?: (orderData: Order) => Promise<boolean>;
}

export function useSalesCartSheet({
  onOpenChange,
  onOrderCreate,
}: UseSalesCartSheetProps) {
  const { user, loading: userLoading } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!userLoading) {
      if (user?.user_metadata) {
        setProfile({
          id: user.id,
          name: user.user_metadata.full_name || user.email || '',
          role: user.user_metadata.role || 'customer',
        });
      } else {
        setError(new Error('Profile not found'));
      }
      setIsLoading(false);
    }
  }, [user, userLoading]);
  const supabase = createClient();
  const { toast } = useToast();
  const { items, clearCart, getTotalAmount } = useSalesCartStore();
  const [customer, setCustomer] = useState<Partial<Customer>>({
    id: '',
    email: '',
    name: '',
    status: '',
    role: 'customer',
    created_at: null,
    updated_at: null,
  });
  const [orderStatus, setOrderStatus] = useState<Order['status']>('processing');
  const [isThermalPrintPreviewOpen, setIsThermalPrintPreviewOpen] =
    useState(false);
  const [isOrderConfirmed, setIsOrderConfirmed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isStatusVerified, setIsStatusVerified] = useState<boolean | undefined>(
    false,
  );
  const [isOtpDialogOpen, setIsOtpDialogOpen] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [hasToggledLock, setHasToggledLock] = useState(false);
  const [isOrderSaved, setIsOrderSaved] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'save' | 'cancel' | null>(
    null,
  );

  const pathname = usePathname();

  const onOtpChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
  };

  const handleOtpSubmit = () => {
    console.log('OTP submitted:', otp.join(''));
  };

  useEffect(() => {
    if (items.length === 0) {
      setIsOrderConfirmed(false);
      setIsStatusVerified(false);
      setHasToggledLock(false);
    }
  }, [items]);

  const handleThermalPrintPreview = () => {
    setIsThermalPrintPreviewOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    try {
      if (items.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No items to share',
        });
        return;
      }

      // Format order details with better spacing
      const orderDetails = items
        .map(
          item =>
            `• ${item.name}\n  Quantity: ${(item.grams / 1000).toFixed(
              2,
            )}kg\n  Price: Br ${((item.pricePerKg * item.grams) / 1000).toFixed(
              2,
            )}`,
        )
        .join('\n\n');

      const shareText = `🌿 *Betty Organic Order*\n\n${orderDetails}\n\n💰 *Total: Br ${getTotalAmount().toFixed(
        2,
      )}*`;

      // Check if Web Share API is available and supported
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: 'Betty Organic Order',
            text: shareText,
          });
          toast({
            title: 'Success',
            description: 'Order shared successfully',
          });
        } catch (shareError) {
          // User cancelled or share failed - fallback to WhatsApp
          if ((shareError as Error).name !== 'AbortError') {
            throw shareError;
          }
        }
      } else {
        // Fallback to WhatsApp
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
          shareText,
        )}`;
        const newWindow = window.open(whatsappUrl, '_blank');

        if (newWindow) {
          toast({
            title: 'WhatsApp',
            description: 'Opening WhatsApp to share order',
          });
        } else {
          throw new Error(
            'Popup blocked - please allow popups to share via WhatsApp',
          );
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to share order',
      });
    }
  };

  const handleConfirmOrder = async () => {
    setIsOrderConfirmed(true);
    // Order status is already set based on role in the useEffect
  };

  const handleBackToCart = () => {
    setIsOrderConfirmed(false);
    setIsStatusVerified(false);
    setHasToggledLock(false);
    // Reset order status when going back to cart
    setOrderStatus('processing');
  };

  // Set initial order status based on profile role
  useEffect(() => {
    if (profile) {
      const initialStatus = profile.role === 'admin' ? 'processing' : 'pending';
      setOrderStatus(initialStatus);
    }
  }, [profile]);

  const handleSaveOrder = async (customerData: any) => {
    try {
      console.log('Saving order with profile:', profile);
      console.log('Customer data:', customerData);

      if (!customerData?.id || !customerData?.name) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Please select a customer',
        });
        return;
      }

      if (!profile?.id) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'You must be logged in to create orders',
        });
        return;
      }

      if (!profile.role || !['admin', 'sales'].includes(profile.role)) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Insufficient permissions to create orders',
        });
        return;
      }

      setCustomer(customerData);

      setIsSaving(true);
      const totalAmount = getTotalAmount();

      // Prepare order data
      const orderData: Order = {
        id: '', // Required field for Order type
        profile_id: profile.id,
        customer_profile_id: customerData.id,
        status: orderStatus,
        total_amount: totalAmount,
        type: 'store',
        order_items: items.map(item => ({
          id: '', // Will be assigned by database
          order_id: '', // Will be assigned by database
          product_id: item.id,
          quantity: Math.round(item.grams),
          price: (item.pricePerKg * item.grams) / 1000,
          product_name: item.name,
        })),
        created_at: new Date().toISOString(), // Required field
        updated_at: new Date().toISOString(), // Required field
      };

      console.log('Prepared order data:', orderData);

      // Use onOrderCreate if provided, otherwise fall back to createOrder
      let success = false;
      if (onOrderCreate) {
        console.log('Using provided onOrderCreate callback');
        success = await onOrderCreate(orderData);
      } else {
        console.log('Using default createOrder function');
        console.log('Creating order with data:', orderData);
        const { data: order, error: orderError } = await createOrder(orderData);
        console.log('Create order response:', { order, error: orderError });

        if (orderError) {
          console.error('Order creation error:', orderError);
          throw new Error(orderError.message || 'Failed to save order');
        }
        success = true;
        if (order?.id) {
          setOrderNumber(order.id);
          console.log('Order created successfully with ID:', order.id);
        }
      }

      if (success) {
        console.log('Order created successfully');
        setIsOrderSaved(true);
        clearCart();
        onOpenChange(false);

        toast({
          title: 'Success',
          description: `Order saved successfully for customer ${customerData.name}!`,
        });
      } else {
        console.error('Order creation failed - success flag is false');
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Order creation failed. Please try again.',
        });
      }
    } catch (error: any) {
      console.error('Failed to save order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save order. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseCart = () => {
    if (items.length > 0) {
      handleConfirmDialog('cancel');
    } else {
      onOpenChange(false);
    }
  };

  const handleConfirmDialog = (
    action: 'save' | 'cancel',
    selectedCustomer: any = null,
  ) => {
    console.log('handleConfirmDialog called with:', {
      action,
      selectedCustomer,
    });

    if (action === 'save') {
      // Save order directly without confirmation dialog
      handleSaveOrder(selectedCustomer);
    } else if (action === 'cancel') {
      // Just clear cart and close
      if (!isOrderSaved) {
        clearCart();
        onOpenChange(false);
      }
    }
  };

  const handleConfirmAction = async (action: 'save' | 'cancel') => {
    if (action === 'save') {
      await handleSaveOrder(customer); // Pass customer data as required argument
    } else {
      handleBackToCart();
    }
  };

  return {
    profile,
    error,
    isLoading,
    items,
    customer,
    setCustomer,
    orderStatus,
    setOrderStatus,
    isThermalPrintPreviewOpen,
    setIsThermalPrintPreviewOpen,
    isOrderConfirmed,
    setIsOrderConfirmed,
    isSaving,
    setIsSaving,
    isStatusVerified,
    setIsStatusVerified,
    isOtpDialogOpen,
    setIsOtpDialogOpen,
    otp,
    setOtp,
    hasToggledLock,
    setHasToggledLock,
    isOrderSaved,
    setIsOrderSaved,
    orderNumber,
    setOrderNumber,
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
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    confirmAction,
    setConfirmAction,
  };
}
