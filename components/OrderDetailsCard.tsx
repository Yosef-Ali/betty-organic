// OrderDetails.tsx
"use client"

import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  MoreVertical,
  Truck,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import { Separator } from "@/components/ui/separator"
import { deleteOrder, getOrderDetails } from '@/app/actions/orderActions';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useRouter } from 'next/navigation';

export default function OrderDetails({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<{
    id: string;
    createdAt: string;
    updatedAt?: string;
    customer: {
      fullName: string;
      email: string;
      phone: string;
    };
    items: Array<{
      id: string;
      product: {
        name: string;
      };
      price: number;
      quantity: number;
    }>;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrderDetails() {
      try {
        const { data: orderData, error } = await getOrderDetails(orderId);
        
        if (error) {
          // Handle RLS-related errors specifically
          if (error.message.includes('permission denied')) {
            throw new Error('You do not have permission to view this order');
          }
          if (error.message.includes('JWT expired')) {
            // Redirect to login if token is expired
            router.push('/auth/signin');
            return;
          }
          throw error;
        }

        // Check if user is authenticated
        if (!orderData) {
          throw new Error('Authentication required. Please login again.');
        }

        // Ensure we have a valid order structure
        if (!orderData || !orderData.items || !orderData.customer) {
          throw new Error('Invalid order data structure');
        }

        // Check if products are available
        const unavailableProducts = orderData.items.filter(
          (item: any) => !item.product || !item.product.name
        );
        
        if (unavailableProducts.length > 0) {
          throw new Error('Some products in this order are no longer available');
        }

        // Create a plain object with only the necessary data
        const plainOrder = JSON.parse(JSON.stringify({
          id: orderData.id,
          createdAt: orderData.created_at,
          updatedAt: orderData.updated_at || null,
          customer: {
            fullName: orderData.customer.full_name || '',
            email: orderData.customer.email || '',
            phone: orderData.customer.phone || ''
          },
          items: orderData.items.map(item => ({
            id: item.id,
            product: {
              name: item.product?.name || 'Unknown Product'
            },
            price: item.price || 0,
            quantity: item.quantity || 1
          }))
        }));

        setOrder(plainOrder);
      } catch (error: any) {
        console.error('Error fetching order details:', error);
        return (
          <div className="p-6">
            <div className="text-center text-destructive">
              {error.message || 'Failed to load order details'}
            </div>
            {error.message.includes('permission denied') && (
              <div className="mt-2 text-center text-sm text-muted-foreground">
                Please contact support if you believe this is an error
              </div>
            )}
            {(error.message.includes('JWT expired') || error.message.includes('Authentication required')) && (
              <div className="mt-4 text-center">
                <Button 
                  variant="link" 
                  onClick={() => router.push('/auth/signin')}
                  className="text-primary"
                >
                  Login to continue
                </Button>
              </div>
            )}
          </div>
        );
      }
    }

    fetchOrderDetails();
  }, [orderId]);

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          Loading order details...
        </div>
        <div className="mt-4 text-center">
          <Button 
            variant="link" 
            onClick={() => router.push('/auth/signin')}
            className="text-primary"
          >
            Login to continue
          </Button>
        </div>
      </div>
    );
  }

  const handleTrashClick = () => {
    setIsDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const result = await deleteOrder(orderId);
      if (result.success) {
        setIsDialogOpen(false);
        window.location.href = '/dashboard/orders';
      } else {
        console.error('Error deleting order:', result.error);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
    }
  };

  // Ensure default quantity is 1 if it is 0
  const itemsWithDefaultQuantity = JSON.parse(JSON.stringify(order.items.map(item => ({
    id: item.id,
    product: {
      name: item.product.name
    },
    price: item.price || 0,
    quantity: item.quantity > 0 ? item.quantity : 1
  }))));

  // Calculate the total for each item and the subtotal
  const itemsWithTotal = JSON.parse(JSON.stringify(itemsWithDefaultQuantity.map(item => ({
    id: item.id,
    product: {
      name: item.product.name
    },
    price: item.price,
    quantity: item.quantity,
    total: item.price
  }))));

  const subtotal = itemsWithTotal.reduce((acc: number, item: any) => acc + item.total, 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start bg-muted/50">
        <div className="grid gap-0.5">
          <CardTitle className="group flex items-center gap-2 text-lg">
            Order {order.id}
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Copy className="h-3 w-3" />
              <span className="sr-only">Copy Order ID</span>
            </Button>
          </CardTitle>
          <CardDescription>Date: {new Date(order.createdAt).toLocaleDateString()}</CardDescription>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <Truck className="h-3.5 w-3.5" />
            <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
              Track Order
            </span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline" className="h-8 w-8">
                <MoreVertical className="h-3.5 w-3.5" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Export</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleTrashClick}>Trash</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-6 text-sm">
        <div className="grid gap-3">
          <div className="font-semibold">Order Details</div>
          <ul className="grid gap-3">
            {itemsWithTotal.map((item: any) => (
              <li key={item.id} className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {item.product.name} x <span>{item.quantity / 1000} kg</span>
                </span>
                <span>{item.total.toFixed(2)} Br</span>
              </li>
            ))}
          </ul>
          <Separator className="my-2" />
          <ul className="grid gap-3">
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{subtotal.toFixed(2)} Br</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-muted-foreground">0.00 Br</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="text-muted-foreground">0.00 Br</span>
            </li>
            <li className="flex items-center justify-between font-semibold">
              <span className="text-muted-foreground">Total</span>
              <span>{subtotal.toFixed(2)} Br</span>
            </li>
          </ul>
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-3">
            <div className="font-semibold">Shipping Information</div>
            <address className="grid gap-0.5 not-italic text-muted-foreground">
              <span>{order.customer.fullName}</span>
              <span>1234 Main St.</span>
              <span>Anytown, CA 12345</span>
            </address>
          </div>
          <div className="grid auto-rows-max gap-3">
            <div className="font-semibold">Billing Information</div>
            <div className="text-muted-foreground">
              Same as shipping address
            </div>
          </div>
        </div>
        <Separator className="my-4" />
        <div className="grid gap-3">
          <div className="font-semibold">Customer Information</div>
          <dl className="grid gap-3">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Customer</dt>
              <dd>{order.customer.fullName}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd>
                <a href={`mailto:${order.customer.email}`}>{order.customer.email}</a>
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>
                <a href={`tel:${order.customer.phone}`}>{order.customer.phone}</a>
              </dd>
            </div>
          </dl>
        </div>
        <Separator className="my-4" />
        <div className="grid gap-3">
          <div className="font-semibold">Payment Information</div>
          <dl className="grid gap-3">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Visa
              </dt>
              <dd>**** **** **** 4532</dd>
            </div>
          </dl>
        </div>
      </CardContent>
      <CardFooter className="flex flex-row items-center border-t bg-muted/50 px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Updated <time dateTime={order.updatedAt ? new Date(order.updatedAt).toISOString() : new Date().toISOString()}>
            {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : 'Just now'}
          </time>
        </div>
        <Pagination className="ml-auto mr-0 w-auto">
          <PaginationContent>
            <PaginationItem>
              <Button size="icon" variant="outline" className="h-6 w-6">
                <ChevronLeft className="h-3.5 w-3.5" />
                <span className="sr-only">Previous Order</span>
              </Button>
            </PaginationItem>
            <PaginationItem>
              <Button size="icon" variant="outline" className="h-6 w-6">
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="sr-only">Next Order</span>
              </Button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
