"use client";

import { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRecentSales } from "@/app/actions/supabase-actions";
import { formatOrderCurrency } from "@/lib/utils";
import { useRealtime } from "@/lib/supabase/realtime-provider";

type RecentSale = {
  id: string;
  total_amount: number;
  profiles: {
    name: string;
    email: string;
  };
};

export function RecentSales() {
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const { subscribeToOrders } = useRealtime();

  const fetchRecentSales = useCallback(async () => {
    try {
      const sales = await getRecentSales();
      setRecentSales(sales);
    } catch (error) {
      console.error('Error fetching recent sales:', error);
    }
  }, []); // Empty dependencies

  // Handle realtime order updates to refresh sales
  const handleOrderUpdate = useCallback((order: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
    // Refresh recent sales when orders change
    fetchRecentSales();
  }, []); // Empty dependencies

  useEffect(() => {
    // Initial fetch
    fetchRecentSales();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToOrders(handleOrderUpdate);

    return unsubscribe;
  }, []); // Empty dependencies

  return (
    <div className="space-y-8">
      {recentSales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={`https://avatar.vercel.sh/${sale.profiles.email}.png`}
              alt={sale.profiles.name}
            />
            <AvatarFallback>{sale.profiles.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">
              {sale.profiles.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {sale.profiles.email}
            </p>
          </div>
          <div className="ml-auto font-medium">
            +{formatOrderCurrency(sale.total_amount)}
          </div>
        </div>
      ))}
    </div>
  );
}
