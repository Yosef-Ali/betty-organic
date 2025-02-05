import { useState, useEffect, useCallback, useReducer } from 'react';
import { useSalesCartStore } from '@/store/salesCartStore';
import { usePathname } from 'next/navigation';
import { createOrder } from '@/app/actions/orderActions';
import { Order } from '@/types/order';
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
    profile: user
      ? {
          id: user.id,
          name: user.email || '',
          role: user.profile?.role || 'customer',
        }
      : null,
    orderStatus: user?.profile?.role === 'admin' ? 'processing' : 'pending',
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

  const onOtpChange = useCallback(
    (index: number, value: string) => {
      dispatch({
        type: 'SET_OTP',
        payload: state.otp.map((item, i) => (i === index ? value : item)),
      });
    },
    [state.otp],
  );

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
      console.error('Error sharing:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to share order',
      });
    }
  }, [items, getTotalAmount, toast]);

  const handleSaveOrder = useCallback(
    async (customerData: any) => {
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

        // Use profile ID from state or user object
        const profileId = state.profile?.id || user?.id;

        // Check if user has required role permissions first
        if (
          !state.profile?.role ||
          !['admin', 'sales'].includes(state.profile.role)
        ) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Insufficient permissions to create orders',
          });
          return;
        }

        if (
          !state.profile.role ||
          !['admin', 'sales'].includes(state.profile.role)
        ) {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Insufficient permissions to create orders',
          });
          return;
        }

        dispatch({ type: 'SET_CUSTOMER', payload: customerData });
        dispatch({ type: 'SET_SAVING', payload: true });

        const totalAmount = getTotalAmount();
        const orderData: Order = {
          id: '',
          profile_id: state.profile.id,
          customer_profile_id: customerData.id,
          status: state.orderStatus,
          total_amount: totalAmount,
          type: 'store',
          order_items: items.map(item => ({
            id: '',
            order_id: '',
            product_id: item.id,
            quantity: Math.round(item.grams),
            price: (item.pricePerKg * item.grams) / 1000,
            product_name: item.name,
          })),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        let success = false;
        if (onOrderCreate) {
          success = await onOrderCreate(orderData);
        } else {
          const { data: order, error: orderError } = await createOrder(
            orderData,
          );

          if (orderError) {
            throw new Error(orderError.message || 'Failed to save order');
          }
          success = true;
          if (order?.id) {
            dispatch({ type: 'SET_ORDER_NUMBER', payload: order.id });
          }
        }

        if (success) {
          dispatch({ type: 'SET_ORDER_SAVED', payload: true });
          clearCart();
          onOpenChange(false);

          toast({
            title: 'Success',
            description: `Order saved successfully for customer ${customerData.name}!`,
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Order creation failed. Please try again.',
          });
        }
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            error.message || 'Failed to save order. Please try again.',
        });
      } finally {
        dispatch({ type: 'SET_SAVING', payload: false });
      }
    },
    [
      state.profile,
      state.orderStatus,
      items,
      getTotalAmount,
      clearCart,
      onOrderCreate,
      onOpenChange,
      toast,
      user?.id,
    ],
  );

  const handleCloseCart = useCallback(() => {
    if (items.length > 0) {
      handleConfirmDialog('cancel');
    } else {
      onOpenChange(false);
    }
  }, [items.length, onOpenChange, handleConfirmDialog]);

  const handleConfirmDialog = useCallback(
    (action: 'save' | 'cancel', selectedCustomer: any = null) => {
      if (action === 'save') {
        handleSaveOrder(selectedCustomer);
      } else if (action === 'cancel' && !state.isOrderSaved) {
        clearCart();
        onOpenChange(false);
      }
    },
    [handleSaveOrder, state.isOrderSaved, clearCart, onOpenChange],
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
        console.error('Error in handleConfirmAction:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : 'An unexpected error occurred',
        });
      }
    },
    [state.customer, handleSaveOrder, handleBackToCart, toast],
  );

  return {
    profile: state.profile,
    error: state.error,
    isLoading: state.isLoading,
    items,
    customer: state.customer,
    setCustomer: useCallback(
      (customer: Partial<Customer>) =>
        dispatch({ type: 'SET_CUSTOMER', payload: customer }),
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
    setIsThermalPrintPreviewOpen: useCallback(
      (value: boolean) =>
        dispatch({ type: 'SET_THERMAL_PREVIEW', payload: value }),
      [],
    ),
    setIsOtpDialogOpen: useCallback(
      (value: boolean) => dispatch({ type: 'SET_OTP_DIALOG', payload: value }),
      [],
    ),
  };
}
