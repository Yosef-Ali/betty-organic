import { useState, useEffect, useCallback, useReducer } from 'react';
import { useSalesCartStore } from '@/store/salesCartStore';
import { usePathname } from 'next/navigation';
import { createOrder } from '@/app/actions/orderActions';
import { Order, OrderItem } from '@/types/order';
import { Customer } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  name: string;
  role: string;
  email?: string;
}

interface CartState {
  isLoading: boolean;
  error: Error | null;
  profile: Profile | null;
  orderStatus: Order['status'];
  customer: Partial<Customer>;
  isThermalPrintPreviewOpen: boolean;
  isOrderConfirmed: boolean;
  isSaving: boolean;
  isStatusVerified: boolean;
  isOtpDialogOpen: boolean;
  otp: string[];
  hasToggledLock: boolean;
  isOrderSaved: boolean;
  orderNumber: string;
}

type CartAction =
  | { type: 'SET_PROFILE'; payload: { profile: Profile | null; role?: string } }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ORDER_STATUS'; payload: Order['status'] }
  | { type: 'SET_CUSTOMER'; payload: Partial<Customer> }
  | { type: 'SET_THERMAL_PREVIEW'; payload: boolean }
  | { type: 'SET_ORDER_CONFIRMED'; payload: boolean }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_STATUS_VERIFIED'; payload: boolean }
  | { type: 'SET_OTP_DIALOG'; payload: boolean }
  | { type: 'SET_OTP'; payload: string[] }
  | { type: 'SET_TOGGLED_LOCK'; payload: boolean }
  | { type: 'SET_ORDER_SAVED'; payload: boolean }
  | { type: 'SET_ORDER_NUMBER'; payload: string }
  | { type: 'RESET_CART_STATE' };

const initialCartState: CartState = {
  isLoading: true,
  error: null,
  profile: null,
  orderStatus: 'pending',
  customer: {
    id: '',
    email: '',
    name: '',
    status: '',
    role: 'customer',
    created_at: null,
    updated_at: null,
  },
  isThermalPrintPreviewOpen: false,
  isOrderConfirmed: false,
  isSaving: false,
  isStatusVerified: false,
  isOtpDialogOpen: false,
  otp: ['', '', '', ''],
  hasToggledLock: false,
  isOrderSaved: false,
  orderNumber: '',
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_PROFILE':
      return {
        ...state,
        profile: action.payload.profile,
        orderStatus: action.payload.role === 'admin' ? 'processing' : 'pending',
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ORDER_STATUS':
      return { ...state, orderStatus: action.payload };
    case 'SET_CUSTOMER':
      return { ...state, customer: { ...state.customer, ...action.payload } };
    case 'SET_THERMAL_PREVIEW':
      return { ...state, isThermalPrintPreviewOpen: action.payload };
    case 'SET_ORDER_CONFIRMED':
      return { ...state, isOrderConfirmed: action.payload };
    case 'SET_SAVING':
      return { ...state, isSaving: action.payload };
    case 'SET_STATUS_VERIFIED':
      return { ...state, isStatusVerified: action.payload };
    case 'SET_OTP_DIALOG':
      return { ...state, isOtpDialogOpen: action.payload };
    case 'SET_OTP':
      return { ...state, otp: action.payload };
    case 'SET_TOGGLED_LOCK':
      return { ...state, hasToggledLock: action.payload };
    case 'SET_ORDER_SAVED':
      return { ...state, isOrderSaved: action.payload };
    case 'SET_ORDER_NUMBER':
      return { ...state, orderNumber: action.payload };
    case 'RESET_CART_STATE':
      return {
        ...initialCartState,
        profile: state.profile,
        orderStatus: state.profile?.role === 'admin' ? 'processing' : 'pending',
      };
    default:
      return state;
  }
}

interface UseSalesCartSheetProps {
  onOpenChange: (open: boolean) => void;
  onOrderCreate?: (orderData: Order) => Promise<boolean>;
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

export function useSalesCartSheet({
  onOpenChange,
  onOrderCreate,
  user,
}: UseSalesCartSheetProps) {
  const [state, dispatch] = useReducer(cartReducer, {
    ...initialCartState,
    profile: user ? {
      id: user.id,
      name: user.email || '',
      role: user.profile?.role || 'customer',
    } : null,
    orderStatus: user?.profile?.role === 'admin' ? 'processing' : 'pending'
  });

  const { toast } = useToast();
  const { items, clearCart, getTotalAmount } = useSalesCartStore();

  useEffect(() => {
    if (items.length === 0) {
      dispatch({ type: 'RESET_CART_STATE' });
    }
  }, [items]);

  const handleBackToCart = useCallback(() => {
    dispatch({ type: 'RESET_CART_STATE' });
  }, []);

  const handleConfirmOrder = useCallback(async () => {
    dispatch({ type: 'SET_ORDER_CONFIRMED', payload: true });
    return Promise.resolve();
  }, []);

  const handleThermalPrintPreview = useCallback(() => {
    dispatch({ type: 'SET_THERMAL_PREVIEW', payload: true });
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const onOtpChange = useCallback((index: number, value: string) => {
    dispatch({
      type: 'SET_OTP',
      payload: state.otp.map((item, i) => (i === index ? value : item)),
    });
  }, [state.otp]);

  const handleOtpSubmit = useCallback(() => {
    console.log('OTP submitted:', state.otp.join(''));
  }, [state.otp]);

  const handleShare = useCallback(async () => {
    try {
      if (items.length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'No items to share',
        });
        return;
      }

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
          if ((shareError as Error).name !== 'AbortError') {
            throw shareError;
          }
        }
      } else {
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
      const e = error as Error;
      console.error('Error sharing:', e);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message || 'Failed to share order',
      });
    }
  }, [items, getTotalAmount, toast]);

  const handleSaveOrder = useCallback(
    async (customerData: Partial<Customer>) => {
      try {
        if (!customerData?.id || !customerData?.name) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please select a customer',
          });
          return;
        }

        if (!state.profile) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'You must be logged in to create orders',
          });
          return;
        }

        // Check if user has required role permissions first
        if (!state.profile?.role || !['admin', 'sales'].includes(state.profile.role)) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Insufficient permissions to create orders'
          });
          return;
        }

        dispatch({ type: 'SET_CUSTOMER', payload: customerData });
        dispatch({ type: 'SET_SAVING', payload: true });

        const totalAmount = getTotalAmount();

        // Prepare order items
        const orderItems: OrderItem[] = items.map(item => ({
          product_id: item.id,
          quantity: Math.round(item.grams),
          price: (item.pricePerKg * item.grams) / 1000,
          product_name: item.name
        }));

        // Create order
        const orderResult = await createOrder(
          orderItems,
          customerData.id,
          totalAmount,
          state.orderStatus
        );

        if (orderResult.success && orderResult.order) {
          dispatch({ type: 'SET_ORDER_NUMBER', payload: orderResult.order.id });
          dispatch({ type: 'SET_ORDER_SAVED', payload: true });
          clearCart();
          onOpenChange(false);

          toast({
            title: 'Success',
            description: `Order saved successfully for customer ${customerData.name}!`,
          });
        } else {
          const errorMessage = orderResult.error?.message || 'Order creation failed. Please try again.';
          toast({
            variant: 'destructive',
            title: 'Error',
            description: errorMessage,
          });
        }
      } catch (error) {
        const e = error as Error;
        toast({
          variant: 'destructive',
          title: 'Error',
          description: e.message || 'Failed to save order. Please try again.',
        });
      } finally {
        dispatch({ type: 'SET_SAVING', payload: false });
      }
    },
    [state.profile, state.orderStatus, items, getTotalAmount, clearCart, onOpenChange, toast],
  );

  const handleConfirmAction = useCallback(
    async (action: 'save' | 'cancel') => {
      try {
        if (action === 'save') {
          if (!state.customer?.id) {
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Please select a customer before saving the order',
            });
            return;
          }
          await handleSaveOrder(state.customer);
        } else {
          handleBackToCart();
        }
      } catch (error) {
        const e = error as Error;
        console.error('Error in handleConfirmAction:', e);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: e.message || 'An unexpected error occurred',
        });
      }
    },
    [state.customer, handleSaveOrder, handleBackToCart, toast],
  );

  const handleConfirmDialog = useCallback(async (
    action: 'save' | 'cancel',
    selectedCustomer: Partial<Customer> | null,
  ) => {
    if (action === 'save' && selectedCustomer) {
      await handleSaveOrder(selectedCustomer);
    } else {
      handleConfirmAction(action);
    }
  }, [handleSaveOrder, handleConfirmAction]);

  const handleCloseCart = useCallback(() => {
    if (items.length > 0) {
      handleConfirmDialog('cancel', null);
    } else {
      onOpenChange(false);
    }
  }, [items.length, handleConfirmDialog, onOpenChange]);

  const handleActionConfirmation = useCallback(
    (action: string) => {
      if (action === 'delete') {
        clearCart();
        onOpenChange(false);
      }
    },
    [clearCart, onOpenChange],
  );

  return {
    profile: state.profile,
    error: state.error,
    isLoading: state.isLoading,
    items,
    customer: state.customer,
    setCustomer: useCallback(
      (customer: Partial<Customer>) => dispatch({ type: 'SET_CUSTOMER', payload: customer }),
      [],
    ),
    orderStatus: state.orderStatus,
    setOrderStatus: useCallback(
      (status: Order['status']) =>
        dispatch({ type: 'SET_ORDER_STATUS', payload: status }),
      [],
    ),
    isThermalPrintPreviewOpen: state.isThermalPrintPreviewOpen,
    isOrderConfirmed: state.isOrderConfirmed,
    isSaving: state.isSaving,
    isStatusVerified: state.isStatusVerified,
    isOtpDialogOpen: state.isOtpDialogOpen,
    otp: state.otp,
    hasToggledLock: state.hasToggledLock,
    isOrderSaved: state.isOrderSaved,
    orderNumber: state.orderNumber,
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
    handleActionConfirmation,
    setIsThermalPrintPreviewOpen: useCallback(
      (value: boolean) => dispatch({ type: 'SET_THERMAL_PREVIEW', payload: value }),
      [],
    ),
    setIsOtpDialogOpen: useCallback(
      (value: boolean) => dispatch({ type: 'SET_OTP_DIALOG', payload: value }),
      [],
    ),
  };
}
