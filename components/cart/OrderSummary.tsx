import { FC, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SalesCartItem } from '@/store/salesCartStore';
import { Printer, Lock, Unlock, Share2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { getCustomerList } from '@/app/actions/customerActions';
import { toast } from 'sonner';

interface OrderSummaryProps {
  items: Array<{
    id: string;
    name: string;
    grams: number;
    pricePerKg: number;
    imageUrl: string;
  }>;
  totalAmount: number;
  customerId: string;
  setCustomerId: (id: string) => void;
  orderStatus: string;
  setOrderStatus: (status: string) => void;
  isStatusVerified: boolean;
  handleToggleLock: () => void;
  handleConfirmDialog: (
    action: 'save' | 'cancel',
    selectedCustomer: any,
  ) => void;
  isSaving: boolean;
  onPrintPreview: () => void;
  isOrderSaved: boolean;
  orderNumber?: string;
  customerInfo?: {
    id?: string;
    name?: string;
    email?: string;
  };
  setCustomerInfo?: (info: {
    id?: string;
    name?: string;
    email?: string;
  }) => void;
  isAdmin: boolean;
  disabled?: boolean;
  profile?: {
    id: string;
    role: string;
    name: string;
    email?: string;
  };
}

interface CustomerType {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
}

export const OrderSummary: FC<OrderSummaryProps> = ({
  items,
  totalAmount,
  customerId,
  setCustomerId,
  orderStatus,
  setOrderStatus,
  isStatusVerified,
  handleToggleLock,
  handleConfirmDialog,
  isSaving,
  onPrintPreview,
  isOrderSaved,
  orderNumber,
  isAdmin,
  customerInfo,
  setCustomerInfo,
  profile
}) => {
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [customerList, setCustomerList] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerType | null>(null);

  // Log component props when it loads
  useEffect(() => {
    console.log('OrderSummary component loading with props:', { items, totalAmount, customerId, orderStatus, isAdmin, profile });
    console.log('Profile details:', {
      id: profile?.id,
      role: profile?.role,
      name: profile?.name,
      email: profile?.email
    });
  }, [items, totalAmount, customerId, orderStatus, isAdmin, profile]);

  // Effect for fetching customers - runs only once
  useEffect(() => {
    let isMounted = true;

    const fetchCustomers = async () => {
      try {
        const customers = await getCustomerList();
        if (isMounted) {
          setCustomerList(customers);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Separate effect for updating selected customer when customerInfo changes
  useEffect(() => {
    if (customerInfo?.id && customerList.length > 0) {
      const matchingCustomer = customerList.find(c => c.id === customerInfo.id);
      if (
        matchingCustomer &&
        (!selectedCustomer || selectedCustomer.id !== matchingCustomer.id)
      ) {
        setSelectedCustomer(matchingCustomer);
      }
    }
  }, [customerInfo?.id, customerList]);

  // Effect for setting customer details when selectedCustomer changes
  useEffect(() => {
    if (selectedCustomer) {
      setCustomerDetails(prev => ({
        ...prev,
        name: selectedCustomer.name || prev.name,
        email: selectedCustomer.email || prev.email,
        phone: selectedCustomer.phone || prev.phone,
        address: selectedCustomer.address || prev.address
      }));
    }
  }, [selectedCustomer, setCustomerDetails]);

  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOrderStatusChange = useCallback(
    (status: string) => {
      if (status !== orderStatus) {
        setOrderStatus(status);
      }
    },
    [orderStatus, setOrderStatus],
  );

  const handleCustomerChange = useCallback(
    (value: string) => {
      const selected = customerList.find(c => c.id === value);
      if (selected) {
        const customerData = {
          id: selected.id,
          name: selected.name,
        };
        setSelectedCustomer(selected);
        setCustomerId(selected.id);
        if (setCustomerInfo) {
          setCustomerInfo(customerData);
        }
      }
    },
    [customerList, setCustomerInfo, setCustomerId],
  );

  const handleShare = async (shareType: 'direct' | 'group') => {
    try {
      const orderDetails = items
        .map(
          item =>
            `🛍️ *${item.name}*\n` +
            `   • Quantity: ${(item.grams / 1000).toFixed(3)} kg\n` +
            `   • Price: Br ${((item.pricePerKg * item.grams) / 1000).toFixed(
              2,
            )}`,
        )
        .join('\n\n');

      const storeInfo = `
📍 *Location:* Genet Tower, Office #505
📞 *Contact:* +251947385509
🌐 *Instagram:* @bettyorganic`;

      const shareText = `
🌿 *Betty Organic Store* 🌿

📅 *Order Date:* ${formatDate()}

📝 *Order Details:*
${orderDetails}

💰 *Total Amount:* Br ${totalAmount.toFixed(2)}
${customerId ? `\n👤 *Customer ID:* ${customerId}` : ''}

✨ Thank you for choosing Betty Organic! ✨

${storeInfo}`;

      if (shareType === 'group') {
        window.open(
          'https://chat.whatsapp.com/your-group-invite-link',
          '_blank',
        );
      } else {
        const whatsappUrl = `https://wa.me/251947385509?text=${encodeURIComponent(
          shareText,
        )}`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      setCustomerDetails(prev => ({
        ...prev,
        name: selectedCustomer.name || prev.name,
        email: selectedCustomer.email || prev.email,
        phone: selectedCustomer.phone || prev.phone,
        address: selectedCustomer.address || prev.address
      }));
    }
  }, [selectedCustomer, setCustomerDetails]);

  return (
    <motion.div
      key="order-summary"
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: '0%' }}
      exit={{ opacity: 0, x: '-100%' }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="font-semibold text-lg">Order Summary</h3>
          {orderNumber && (
            <p className="text-sm text-muted-foreground">
              Order ID: {orderNumber}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onPrintPreview}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-green-500/10 hover:bg-green-500/20 text-green-600"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                Share
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleShare('direct')}>
                Share to Manager
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('group')}>
                Share to Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {items.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.name} ({item.grams}g)
            </span>
            <span>
              Br. {((item.pricePerKg * item.grams) / 1000).toFixed(2)}
            </span>
          </div>
        ))}
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>Br {totalAmount.toFixed(2)}</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-muted/30">
          <h4 className="font-semibold mb-3">Customer Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Customer</Label>
              <Select
                onValueChange={handleCustomerChange}
                value={selectedCustomer?.id || customerId || ''}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customerList.map(customer => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name} ({customer.id.substring(28)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-2">
            <div className="flex-grow">
              <Label htmlFor="order-status" className="text-sm font-medium">
                Order Status
              </Label>
              <Select
                value={orderStatus}
                onValueChange={handleOrderStatusChange}
              >
                <SelectTrigger id="order-status" className="mt-1">
                  <SelectValue placeholder="Select order status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="mt-6"
              onClick={handleToggleLock}
            >
              {orderStatus === 'pending' ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => handleConfirmDialog('cancel', null)}
        >
          Cancel
        </Button>
        <Button
          onClick={() => {
            if (!profile) {
              toast.error("You must be logged in to create an order");
              return;
            }
            if (!profile.role) {
              toast.error("Your profile is missing required permissions");
              return;
            }
            if (profile.role !== 'admin' && profile.role !== 'sales') {
              toast.error("Access Denied - Only admin or sales users can create orders");
              return;
            }
            if (!selectedCustomer) {
              toast.error("Please select a customer before saving the order");
              return;
            }
            handleConfirmDialog('save', {
              id: selectedCustomer.id,
              name: selectedCustomer.name,
              role: 'customer',
            });
          }}
          disabled={isSaving || !selectedCustomer || isOrderSaved}
        >
          {isSaving ? 'Saving...' : 'Save Order'}
        </Button>
      </div>
    </motion.div>
  );
};
