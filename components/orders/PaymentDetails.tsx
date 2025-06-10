'use client';

import { useState, useCallback } from 'react';
import { CreditCard, CheckCircle, Clock, AlertCircle, RefreshCw, ArrowRight, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { updateOrderStatus } from '@/app/actions/orderActions';
import { cn } from '@/lib/utils';

interface PaymentMethod {
  type: 'visa' | 'mastercard' | 'amex' | 'cash' | 'bank_transfer';
  last4?: string;
  method_name?: string;
}

interface PaymentDetailsProps {
  orderId?: string;
  orderStatus?: string;
  totalAmount?: number;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  onStatusChange?: (newStatus: string) => void;
}

export default function PaymentDetails({ 
  orderId,
  orderStatus = 'pending',
  totalAmount = 0,
  paymentStatus = 'pending',
  paymentMethod,
  paymentDate,
  onStatusChange 
}: PaymentDetailsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Default payment method for demo
  const defaultPayment: PaymentMethod = {
    type: 'cash',
    method_name: 'Cash on Delivery',
  };

  const payment = paymentMethod || defaultPayment;

  const handleStatusUpdate = useCallback(async (newStatus: string) => {
    if (!orderId) {
      toast({
        title: 'Error',
        description: 'Order ID is required to update status',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateOrderStatus(orderId, newStatus);
      
      if (result.success) {
        toast({
          title: 'Status Updated',
          description: `Order status changed to ${newStatus}`,
        });
        onStatusChange?.(newStatus);
      } else {
        toast({
          title: 'Update Failed',
          description: result.error || 'Failed to update order status',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [orderId, onStatusChange, toast]);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'refunded': return <RefreshCw className="h-4 w-4 text-blue-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNextOrderStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'processing';
      case 'processing': return 'completed';
      default: return null;
    }
  };

  const canAdvanceOrder = (currentStatus: string) => {
    return currentStatus === 'pending' || currentStatus === 'processing';
  };

  const nextStatus = getNextOrderStatus(orderStatus);

  return (
    <div className="space-y-4">
      <div className="font-semibold">Order Management</div>
      
      {/* Payment Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Payment Status</span>
            <Badge className={cn("text-xs border", getPaymentStatusColor(paymentStatus))}>
              {getPaymentIcon(paymentStatus)}
              <span className="ml-1 capitalize">{paymentStatus}</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Payment Method */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                <span className="capitalize">
                  {payment.method_name || payment.type}
                </span>
              </div>
              <div className="font-mono text-sm">
                {payment.last4 ? `**** **** **** ${payment.last4}` : 'COD'}
              </div>
            </div>

            {/* Payment Amount */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                <span>Amount</span>
              </div>
              <div className="font-semibold text-green-600">
                Br {totalAmount.toFixed(2)}
              </div>
            </div>

            {/* Payment Date */}
            {paymentDate && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Date</span>
                <span className="text-sm">
                  {new Date(paymentDate).toLocaleDateString()}
                </span>
              </div>
            )}

            {/* Action buttons for pending orders */}
            {orderStatus === 'pending' && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="text-xs text-amber-700 bg-amber-50 p-2 rounded border border-amber-200 mb-2">
                    💰 Cash payment will be collected upon delivery
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleStatusUpdate('processing')}
                    disabled={isUpdating}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    {isUpdating ? 'Processing...' : 'Start Processing Order'}
                  </Button>
                  <Button
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isUpdating ? 'Processing...' : 'Mark as Completed & Paid'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order Status Management */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span>Order Status</span>
            <Badge className={cn("text-xs border", getOrderStatusColor(orderStatus))}>
              <span className="capitalize">{orderStatus}</span>
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Status Flow Visualization */}
            <div className="flex items-center justify-between text-xs">
              <div className={cn(
                "flex items-center gap-1",
                orderStatus === 'pending' ? 'text-yellow-600 font-medium' : 
                ['processing', 'completed'].includes(orderStatus) ? 'text-green-600' : 'text-gray-400'
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  orderStatus === 'pending' ? 'bg-yellow-500' :
                  ['processing', 'completed'].includes(orderStatus) ? 'bg-green-500' : 'bg-gray-300'
                )} />
                Pending
              </div>
              
              <ArrowRight className="h-3 w-3 text-gray-400" />
              
              <div className={cn(
                "flex items-center gap-1",
                orderStatus === 'processing' ? 'text-blue-600 font-medium' :
                orderStatus === 'completed' ? 'text-green-600' : 'text-gray-400'
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  orderStatus === 'processing' ? 'bg-blue-500' :
                  orderStatus === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                )} />
                Processing
              </div>
              
              <ArrowRight className="h-3 w-3 text-gray-400" />
              
              <div className={cn(
                "flex items-center gap-1",
                orderStatus === 'completed' ? 'text-green-600 font-medium' : 'text-gray-400'
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  orderStatus === 'completed' ? 'bg-green-500' : 'bg-gray-300'
                )} />
                Completed
              </div>
            </div>

            {/* Status Action Buttons */}
            {canAdvanceOrder(orderStatus) && nextStatus && orderStatus === 'processing' && (
              <>
                <Separator />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={isUpdating}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Updating...' : `Move to ${nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}`}
                </Button>
              </>
            )}

            {/* Processing notice */}
            {orderStatus === 'processing' && (
              <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                📦 Order is being processed - payment will be collected upon delivery
              </div>
            )}

            {/* Completed notice */}
            {orderStatus === 'completed' && (
              <div className="text-xs text-green-700 bg-green-50 p-2 rounded border border-green-200">
                ✅ Order completed & payment received
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
