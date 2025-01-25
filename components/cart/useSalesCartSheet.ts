import { useState, useEffect } from 'react';
import { useSalesCartStore } from '@/store/salesCartStore';
import { usePathname } from 'next/navigation';
import { createOrder } from '@/app/actions/orderActions';
import { Order } from '@/types/order';
import { Customer } from '@/types/customer';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

import { useAuth } from '@/contexts/auth/AuthContext';

export const useSalesCartSheet = (onOpenChange: (open: boolean) => void) => {
  const supabase = createClient();
  const { toast } = useToast();
  const { profile } = useAuth();
  const { items, clearCart, getTotalAmount } = useSalesCartStore();
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    email: '',
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
      const orderDetails = items
        .map(
          item =>
            `${item.name} (${item.grams}g): Br ${(
              (item.pricePerKg * item.grams) /
              1000
            ).toFixed(2)}`,
        )
        .join('\n');

      const shareText = `*Betty Organic Order*\n\n${orderDetails}\n\n*Total: Br ${getTotalAmount().toFixed(
        2,
      )}*`;

      if (navigator.share) {
        await navigator.share({
          title: 'Betty Organic Order',
          text: shareText,
        });
      } else {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
          shareText,
        )}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleConfirmOrder = async () => {
    setIsOrderConfirmed(true);
  };

  const handleBackToCart = () => {
    setIsOrderConfirmed(false);
    setIsStatusVerified(false);
    setHasToggledLock(false);
  };

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

      // Start a transaction
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) {
        console.error('Supabase order error:', orderError);
        throw new Error('Failed to save order to database');
      }

      // Log the order insert result
      console.log('Order saved:', order);

      // Insert order items with correct schema
      const orderItemsData = [];
      for (const item of items) {
        console.log('Processing item:', item);
        try {
          const itemData = {
            order_id: order.id,
            product_id: item.id,
            quantity: Math.round(item.grams),
            price: (item.pricePerKg * item.grams) / 1000,
            product_name: item.name,
          };
          orderItemsData.push(itemData);
        } catch (error) {
          console.error('Error processing item:', item, error);
          throw new Error(
            `Failed to process item ${item.name}: ${error.message}`,
          );
        }
      }

      console.log('Order items to insert:', orderItemsData);

      let { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) {
        console.error('Supabase items error:', itemsError);
        // Delete the order if items failed to save
        await supabase.from('orders').delete().eq('id', order.id);
        throw new Error(`Failed to save order items: ${itemsError.message}`);
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
  };
};
