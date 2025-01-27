import { useState, useEffect } from 'react';
import { useMarketingCartStore } from '@/store/cartStore';
import { usePathname } from 'next/navigation';
import { createOrder } from '@/app/actions/orderActions';
import { Order } from '@/types/order';
import { Customer } from '@/types/customer';

export const useCartSheet = (onOpenChange: (open: boolean) => void) => {
  const { items, clearCart, getTotalAmount } = useMarketingCartStore();
  const [customer, setCustomer] = useState<Partial<Customer>>({
    id: '',
    email: '',
    full_name: '',
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
    setIsOrderConfirmed(true);
  };

  const handleBackToCart = () => {
    setIsOrderConfirmed(false);
    setHasToggledLock(false);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      const totalAmount = getTotalAmount();
      const orderItems = items.map(item => ({
        product_id: item.id,
        quantity: item.grams,
        price: (item.pricePerKg * item.grams) / 1000,
        name: item.name,
      }));

      const orderData: Order = {
        customer_id: 'guest', // This should be replaced with actual customer_id when available
        status: orderStatus,
        total_amount: totalAmount,
        type: pathname.includes('/dashboard/sales') ? 'pos' : 'online',
        order_items: orderItems,
      };

      const createdOrder = await createOrder(orderData);
      setOrderNumber(createdOrder?.id?.toString() || '');
      setIsOrderSaved(true);
      clearCart();
    } catch (error) {
      console.error('Failed to save order:', error);
      alert('Failed to save order. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseCart = () => {
    if (items.length > 0) {
      setConfirmAction('cancel');
      if (confirmAction) {
        setIsConfirmDialogOpen(true);
      }
    } else {
      onOpenChange(false);
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
      setCustomer(customerData);
      handleSaveOrder();
    } else if (action === 'cancel') {
      clearCart();
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
