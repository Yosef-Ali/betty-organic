"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "components/ui/avatar";
import { getOrders } from "app/actions/orderActions";
import { formatOrderCurrency } from "@/lib/utils";

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
      fullName: order.customer?.full_name || "Anonymous",
      email: order.customer?.email || null,
      phone: order.customer?.phone || null,
    },
    totalAmount: order.totalAmount,
    createdAt: new Date(order.createdAt),
  };
}

export function RecentSales({ data }: RecentSalesProps) {
  console.log("RecentSales data:", data);
  const [orders, setOrders] = useState<Sale[]>(data.recentSales || []);
  const [totalSales, setTotalSales] = useState<number>(data.totalSales || 0);
  console.log("Orders:", orders);
  console.log("Total sales:", totalSales);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[RecentSales] useEffect running');
    async function fetchOrders() {
      try {
        console.log('[RecentSales] About to call getOrders');
        const orders = await getOrders(undefined, 'RecentSales');
        const mappedSales = orders.map(transformOrderToSale);
        setOrders(mappedSales);
      } catch (error) {
        setError("Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (orders.length === 0) return <div>No orders found</div>;

  function getCustomerDisplay(customer: Sale["customer"]) {
    if (!customer.fullName) {
      if (customer.phone) {
        return {
          primaryInfo: customer.phone,
          secondaryInfo: null,
        };
      } else {
        return {
          primaryInfo: "Anonymous",
          secondaryInfo: null,
        };
      }
    } else {
      return {
        primaryInfo: customer.fullName,
        secondaryInfo:
          customer.email ||
          (customer.phone !== customer.fullName ? customer.phone : null),
      };
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-medium">Recent Sales</h3>
        <div className="text-xs sm:text-sm text-muted-foreground">
          Total: <span className="font-medium">{formatOrderCurrency(totalSales)}</span>
        </div>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {orders.length > 0 ? (
          orders.slice(0, 5).map((sale) => {
            const customerDisplay = getCustomerDisplay(sale.customer);
            return (
              <div key={sale.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <div className="hidden sm:block">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/default-avatar.png" alt="Avatar" />
                    <AvatarFallback className="text-xs">
                      {customerDisplay.primaryInfo
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {customerDisplay.primaryInfo}
                  </p>
                  {customerDisplay.secondaryInfo && (
                    <p className="text-xs text-muted-foreground truncate">
                      {customerDisplay.secondaryInfo}
                    </p>
                  )}
                </div>
                <div className="text-sm font-medium shrink-0">
                  {formatOrderCurrency(sale.totalAmount)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No recent sales found
          </div>
        )}
      </div>
    </div>
  );
}
