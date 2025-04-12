import { FC, useState } from 'react';
import { Printer, Tag, ArrowRight, X, Loader2, Share2, Truck } from 'lucide-react';
import { CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Order, OrderItem } from '@/types/order';
import { Customer } from '@/types/customer';
import { SalesCartItem } from '@/store/salesCartStore';

export interface CartFooterProps {
  getTotalAmount: () => number;
  isPrintPreview: boolean;
  onPrintPreview: () => void;
  onPrint: () => void;
  onCancel?: () => void;
  onShare: () => void;
  onConfirmOrder: () => Promise<void>;
  isOrderConfirmed: boolean;
  disabled?: boolean;
  onOrderCreate?: (orderData: {
    id?: string;
    profile_id?: string;
    customer_profile_id?: string;
    type?: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
      imageUrl: string;
      product_id?: string;
      product_name?: string;
    }>;
    order_items?: OrderItem[];
    customer: Customer | Partial<Customer>;
    total_amount: number;
    delivery_cost: number;
    coupon_code: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    payment_status: string;
  }) => Promise<boolean>;
  items?: Array<{
    id: string;
    name: string;
    pricePerKg: number;
    grams: number;
    unit: string | null;
    imageUrl: string;
  }>;
  customer?: Partial<Customer>;
  clearCart?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export const CartFooter: FC<CartFooterProps> = ({
  getTotalAmount,
  onPrintPreview,
  onShare,
  onConfirmOrder,
  isOrderConfirmed,
  onCancel,
  onOrderCreate,
  items,
  customer,
  clearCart,
  onOpenChange
}) => {
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryCost, setDeliveryCost] = useState(0);
  const { toast } = useToast();

  const handleApplyCoupon = () => {
    if (coupon.trim()) {
      console.log('Applying coupon:', coupon);
      setAppliedCoupon(coupon);
      setCoupon('');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
  };

  const handleConfirmOrder = async () => {
    setIsLoading(true);
    try {
      console.log('[ORDER] Starting order confirmation process...');

      // First confirm the order to update UI state
      await onConfirmOrder();
      console.log('[ORDER] UI state updated - order confirmed');

      // Only proceed with order creation if valid dependencies exist
      if (!onOrderCreate) {
        console.error('[ORDER] Error: onOrderCreate function is not provided');
        return;
      }

      if (!items || items.length === 0) {
        console.error('[ORDER] Error: No items in cart');
        toast({
          title: "Error",
          description: "Cannot create order with an empty cart",
          variant: "destructive",
        });
        return;
      }

      // Use the selected customer if available, otherwise use a valid existing customer ID
      // This ensures we always use a valid profile_id that exists in the database
      const orderCustomer = customer?.id ? {
        // If customer is selected, use their information
        id: customer.id,
        name: customer.name || 'Selected Customer',
        email: customer.email || '',
        role: 'customer' as const
      } : {
        // If no customer is selected, we need to use the same user ID that created the order
        // This is typically the logged-in user (admin or sales staff)
        id: customer?.id || "1d0e9745-575b-41ed-a255-6952cc009103", // Use a known valid ID from your database
        name: 'Walk-in Customer',
        email: '',
        role: 'customer' as const
      };

      console.log('[ORDER] Using customer:', orderCustomer);      // Convert cart items to order items in the format expected by onOrderCreate
      const orderItems = items.map(item => ({
        id: item.id,
        name: item.name,
        price: (item.pricePerKg * item.grams) / 1000, // Total price for this item
        quantity: item.grams / 1000, // Convert grams to kg
        imageUrl: item.imageUrl || '',
        product_id: item.id,
        product_name: item.name
      }));

      console.log('[ORDER] Prepared order items:', orderItems);

      console.log('[ORDER] Using customer:', orderCustomer);

      // Create order data with required structure for backend
      const orderData = {
        items: orderItems,
        customer: orderCustomer, // Use the orderCustomer variable instead of customer directly
        total_amount: totalAmountWithDelivery,
        delivery_cost: deliveryCost,
        coupon_code: appliedCoupon || null,
        status: "completed", // Set as completed immediately
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        payment_status: "paid"
      };

      console.log('[ORDER] Submitting order with data:', JSON.stringify(orderData));

      try {
        const success = await onOrderCreate(orderData);
        console.log('[ORDER] Order creation result:', success);

        if (success) {
          console.log('[ORDER] Order created successfully, clearing cart and closing sheet');
          toast({
            title: "Order Complete",
            description: "Your order has been processed successfully",
          });

          if (clearCart) clearCart();
          if (onOpenChange) onOpenChange(false);
        } else {
          console.error('[ORDER] Order creation failed');
          toast({
            title: "Error",
            description: "Failed to create order. Please try again.",
            variant: "destructive",
          });
        }
      } catch (orderError) {
        console.error('[ORDER] Error during order creation:', orderError);
        toast({
          title: "Error",
          description: orderError instanceof Error
            ? `Order creation failed: ${orderError.message}`
            : "Unknown error during order creation",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[ORDER] General error in handleConfirmOrder:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalAmountWithDelivery = getTotalAmount() + deliveryCost;

  return (
    <CardFooter className="flex-col items-stretch gap-6 pt-4 print:hidden">
      <Separator />

      {/* Delivery Cost Input */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          <Label htmlFor="delivery-cost" className="font-medium">Delivery Cost</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            id="delivery-cost"
            type="number"
            min="0"
            step="1"
            placeholder="Enter delivery cost in Birr"
            value={deliveryCost}
            onChange={(e) => setDeliveryCost(parseFloat(e.target.value) || 0)}
            className="w-full"
          />
        </div>
      </div>

      {/* Total Amount */}
      <div className="flex justify-between items-center">
        <span className="font-semibold text-lg">Total:</span>
        <div className="text-right">
          <span className="font-bold text-2xl">
            Br {totalAmountWithDelivery.toFixed(2)}
          </span>
          {deliveryCost > 0 && (
            <div className="text-sm text-muted-foreground">
              (Includes Br {deliveryCost.toFixed(2)} delivery)
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!isOrderConfirmed && (
          <motion.div
            key="pre-confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2 bg-primary/10 rounded-md">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    Applied: {appliedCoupon}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveCoupon}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    placeholder="Enter coupon code"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value)}
                    className="pr-10"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleApplyCoupon}
                          className="absolute right-0 top-0 h-full"
                          disabled={!coupon.trim()}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Apply Coupon</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={onCancel}
                disabled={isLoading}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleConfirmOrder();
                  if (onOpenChange) onOpenChange(false);
                }}
                disabled={isLoading || !items || items.length === 0}
                className="bg-primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Pay'
                )}
              </Button>
            </div>
          </motion.div>
        )}
        {isOrderConfirmed && (
          <motion.div
            key="post-confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="outline" onClick={onPrintPreview}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CardFooter>
  );
};
