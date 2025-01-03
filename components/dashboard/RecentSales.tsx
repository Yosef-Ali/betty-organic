'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from 'components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from 'components/ui/avatar';
import { getOrders } from 'app/actions/orderActions';

interface Sale {
  id: string;
  customer: {
    fullName: string;
    email: string | null;
    phone: string | null;
  };
  totalAmount: number;
  createdAt: Date;
}

interface RecentSalesProps {
  data: {
    recentSales: any[];
    totalSales: number;
  };
}

function transformOrderToSale(order: any) {
  return {
    id: order.id,
    customer: {
      fullName: order.customer?.full_name || 'Anonymous',
      email: order.customer?.email || null,
      phone: order.customer?.phone || null,
    },
    totalAmount: order.totalAmount,
    createdAt: new Date(order.createdAt),
  };
}

export function RecentSales({ data }: RecentSalesProps) {
  console.log('RecentSales data:', data);
  const [orders, setOrders] = useState<Sale[]>(data.recentSales || []);
  const [totalSales, setTotalSales] = useState<number>(data.totalSales || 0);
  console.log('Orders:', orders);
  console.log('Total sales:', totalSales);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const orders = await getOrders();
        const mappedSales = orders.map(transformOrderToSale);
        setOrders(mappedSales);
      } catch (error) {
        setError('Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (orders.length === 0) return <div>No orders found</div>;

  function getCustomerDisplay(customer: Sale['customer']) {
    if (!customer.fullName) {
      if (customer.phone) {
        return {
          primaryInfo: customer.phone,
          secondaryInfo: null
        };
      } else {
        return {
          primaryInfo: 'Anonymous',
          secondaryInfo: null
        };
      }
    } else {
      return {
        primaryInfo: customer.fullName,
        secondaryInfo: customer.email || (customer.phone !== customer.fullName ? customer.phone : null)
      };
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Sales</CardTitle>
        <div className="text-sm text-muted-foreground">
          Total Sales: <span className="font-medium">{totalSales.toFixed(2)} Br</span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-8">
        {orders.length > 0 ? (
          orders.map((sale) => {
            const customerDisplay = getCustomerDisplay(sale.customer);
            return (
              <div key={sale.id} className="flex items-center gap-4">
                <div className="hidden sm:block">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/default-avatar.png" alt="Avatar" />
                    <AvatarFallback>{customerDisplay.primaryInfo.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="grid gap-1">
                  <p className="text-sm font-medium leading-none">{customerDisplay.primaryInfo}</p>
                  {customerDisplay.secondaryInfo && (
                    <p className="text-sm text-muted-foreground">{customerDisplay.secondaryInfo}</p>
                  )}
                </div>
                <div className="ml-auto font-medium">{sale.totalAmount.toFixed(2)} Br</div>
              </div>
            );
          })
        ) : (
          <div>No recent sales found.</div>
        )}
      </CardContent>
    </Card>
  );
}
