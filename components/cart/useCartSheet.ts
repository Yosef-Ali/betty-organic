import { useState, useEffect } from 'react';
import { useMarketingCartStore } from '@/store/cartStore';
import { usePathname, useRouter } from 'next/navigation'; // Import useRouter
import { createOrder } from '@/app/actions/orderActions';
import { Order } from '@/types/order';
import { Customer } from '@/types/customer';
import { useAuth } from '@/components/providers/AuthProvider'; // Import useAuth
import { toast } from '@/components/ui/use-toast'; // Import toast

export const useCartSheet = (onOpenChange: (open: boolean) => void) => {
  const { items, clearCart, getTotalAmount } = useMarketingCartStore();
  const { user, isLoading: isAuthLoading } = useAuth(); // Call useAuth hook
  const router = useRouter(); // Call useRouter hook

  const [customer, setCustomer] = useState<Partial<Customer>>({
    id: '',
    email: '',
    name: '', // Fix: Use 'name' instead of 'full_name'
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
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'save' | 'cancel'>('save');
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
    // Check auth state before confirming
    if (isAuthLoading) {
      toast({ title: 'Checking authentication...', variant: 'default' });
      return;
    }

    if (!user) {
      toast({ title: 'Please log in', description: 'You need to be logged in to confirm an order.', variant: 'destructive' });
      router.push('/auth/login?redirect=/'); // Redirect to login
      return;
    }

    // If authenticated, proceed
    setIsOrderConfirmed(true);
  };

  const handleBackToCart = () => {
    setIsOrderConfirmed(false);
    setHasToggledLock(false);
  };

  const handleSaveOrder = async () => {
    // Ensure user is available (re-check, though handleConfirmOrder should prevent this state)
    if (!user?.id) {
      toast({ title: 'Authentication Error', description: 'User session lost. Please log in again.', variant: 'destructive' });
      router.push('/auth/login');
      return;
    }

    setIsSaving(true);
    try {
      const totalAmount = getTotalAmount();
      // Map to OrderItem type with 'product_name'
      const orderItems = items.map(item => ({
        product_id: item.id,
        quantity: item.grams,
        price: (item.pricePerKg * item.grams) / 1000,
        product_name: item.name, // Correctly map to product_name
      }));

      // Call createOrder with correct arguments
      const createdOrderResponse = await createOrder(
        orderItems,
        user.id, // Use authenticated user's ID
        totalAmount,
        orderStatus
      );

      if (createdOrderResponse.success && createdOrderResponse.order) {
        const displayId = createdOrderResponse.order.display_id || createdOrderResponse.order.id.toString();
        setOrderNumber(displayId);
        setIsOrderSaved(true);
        clearCart();
        onOpenChange(false); // Close the sheet
        // Stay on marketing page and show success toast
        toast({
          title: 'Order Placed Successfully!',
          description: `Your order #${displayId} has been confirmed.`,
          variant: 'default',
        });
      } else {
        // Handle order creation failure
        console.error('Order creation failed:', createdOrderResponse.error);
        toast({
          title: 'Order Failed',
          description: createdOrderResponse.error?.message || 'Could not place the order. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to save order:', error);
      // Use toast for error feedback instead of alert
      toast({
        title: 'Error Saving Order',
        description: error instanceof Error ? error.message : 'An unknown error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };


  const handleCloseCart = () => {
    if (items.length > 0 && !isOrderSaved) { // Only ask to cancel if items exist and order isn't saved
      setConfirmAction('cancel');
      setIsConfirmDialogOpen(true);
    } else {
      onOpenChange(false); // Close directly if cart is empty or order saved
    }
  };

  const handleConfirmDialog = (action: 'save' | 'cancel') => {
    setConfirmAction(action);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAction = (
    action: 'save' | 'cancel',
    customerData?: { name: string; email: string },
  ) => {
    if (action === 'save' && customerData) {
      setCustomer(prev => ({ ...prev, ...customerData })); // Update customer state correctly
      handleSaveOrder(); // Call save order after setting customer
    } else if (action === 'cancel') {
      clearCart();
      setIsOrderConfirmed(false); // Reset confirmation state
      onOpenChange(false);
    }
    setIsConfirmDialogOpen(false);
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
    isConfirmDialogOpen,
    setIsConfirmDialogOpen,
    confirmAction,
    setConfirmAction,
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
};
