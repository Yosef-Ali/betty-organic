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
    <div className="space-y-4">
      {recentSales.length === 0 ? (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No recent sales
        </div>
      ) : (
        recentSales.map((sale) => (
          <div key={sale.id} className="flex items-center space-x-3">
            <Avatar className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
              <AvatarImage
                src={`https://avatar.vercel.sh/${sale.profiles.email}.png`}
                alt={sale.profiles.name}
              />
              <AvatarFallback className="text-xs">
                {sale.profiles.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none truncate">
                {sale.profiles.name}
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {sale.profiles.email}
              </p>
            </div>
            <div className="text-sm font-medium text-green-600 flex-shrink-0">
              +{formatOrderCurrency(sale.total_amount)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
