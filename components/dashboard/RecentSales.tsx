'use client'

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getOrders } from '@/app/actions/orderActions';

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

export function RecentSales() {
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const orders = await getOrders();
        setOrders(orders);
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
    // Step 1: Check if the customer info has no fullName
    if (!customer.fullName) {
      // Step 2: If no fullName, check phone number
      if (customer.phone) {
        return {
          primaryInfo: customer.phone,
          secondaryInfo: null
        };
      } else {
        // If no phone either, leave empty
        return {
          primaryInfo: 'Anonymous',
          secondaryInfo: null
        };
      }
    } else {
      // If there is a fullName
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
                <div className="ml-auto font-medium">{sale.totalAmount.toFixed(2)} Br</div> {/* Updated to one decimal place */}
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
