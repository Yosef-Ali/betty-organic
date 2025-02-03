import { useState, useEffect } from 'react';
import { useSalesCartStore } from '@/store/salesCartStore';
import { usePathname } from 'next/navigation';
import { createOrder } from '@/app/actions/orderActions';
import { Order } from '@/types/order';
import { Customer } from '@/types/customer';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  role: string;
}

interface UseSalesCartSheetProps {
  profile: Profile | null;
  onOpenChange: (open: boolean) => void;
  onOrderCreate?: (orderData: Order) => Promise<boolean>;
}

export function useSalesCartSheet({
  profile,
  onOpenChange,
  onOrderCreate,
}: UseSalesCartSheetProps) {
  console.log('useSalesCartSheet called with profile:', profile);
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
    // Set initial order status based on user role
    setOrderStatus(profile?.role === 'admin' ? 'processing' : 'pending');
  };

  const handleBackToCart = () => {
    setIsOrderConfirmed(false);
    setIsStatusVerified(false);
    setHasToggledLock(false);
    // Reset order status when going back to cart
    setOrderStatus('processing');
  };

  // Ensure order status changes are restricted to admin
  useEffect(() => {
    if (profile && profile.role !== 'admin' && orderStatus !== 'pending') {
      setOrderStatus('pending');
    }
  }, [profile, orderStatus]);

  const handleSaveOrder = async (customerData: any) => {
    console.log('Starting handleSaveOrder with:', {
      customerData,
      items,
      profile,
    });

    if (!customerData?.id || !customerData?.name) {
      const error = 'Please select a customer';
      console.error('Save failed:', error, { customerData });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error,
      });
      return;
    }

    setIsSaving(true);
    try {
      const totalAmount = getTotalAmount();
      const orderItems = items.map(item => ({
        product_id: item.id,
        quantity: item.grams,
        price: (item.pricePerKg * item.grams) / 1000,
        name: item.name,
      }));

      const orderNumber = `ORDER-${Date.now()}`;

      // Check auth state
      if (!profile?.id || !profile?.name) {
        console.error('Auth state:', {
          profile,
          isLoading: profile === undefined,
        });
        throw new Error('You must be logged in to create orders');
      }

      // Create order data
      const orderData = {
        profile_id: profile.id, // seller's profile ID
        customer_profile_id: customerData.id, // customer's profile ID from profiles table
        status: orderStatus,
        total_amount: totalAmount,
        type: 'store',
      };

      console.log('Attempting to save order:', {
        orderNumber,
        customerId: customerData.id,
        sellerId: profile.id,
        itemCount: orderItems.length,
        total: totalAmount,
      });

      console.log('Creating order with data:', {
        orderData,
        orderItems,
        customerId: customerData.id,
      });

      // Convert cart items to order items format
      const order_items = items.map(item => ({
        product_id: item.id,
        quantity: Math.round(item.grams),
        price: (item.pricePerKg * item.grams) / 1000,
        product_name: item.name,
      }));

      // Use the server action to create order
      const { data: order, error: orderError } = await createOrder({
        ...orderData,
        order_items,
      } as any);

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(orderError.message || 'Failed to save order');
      }

      console.log('Order items saved successfully');

      setOrderNumber(orderNumber);
      setIsOrderSaved(true);
      setCustomer(customerData);
      clearCart();
      onOpenChange(false);

      // Show success message
      toast({
        title: 'Success',
        description: 'Order saved successfully!',
      });
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
  };
}
