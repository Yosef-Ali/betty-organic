"use client";

import { useEffect, useState, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRecentSales } from "@/app/actions/supabase-actions";
import { formatOrderCurrency } from "@/lib/utils";
import { useRealtime } from "@/lib/supabase/realtime-provider";

type RecentSale = {
  id: string;
  total_amount: number;
  is_guest_order?: boolean;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  profiles?: {
    name: string;
    email: string;
  } | null;
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
        recentSales.map((sale) => {
          // Prioritize guest information over profile information
          const isGuest = sale.is_guest_order;
          const displayName = isGuest 
            ? (sale.guest_name ? `Guest: ${sale.guest_name}` : 'Online Guest')
            : sale.profiles?.name || 'Guest Customer';
          const displayEmail = isGuest && sale.guest_email 
            ? sale.guest_email 
            : sale.profiles?.email || 'guest@bettyorganic.com';
          
          return (
            <div key={sale.id} className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0">
                <AvatarImage
                  src={`https://avatar.vercel.sh/${displayEmail}.png`}
                  alt={displayName}
                />
                <AvatarFallback className="text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none truncate">
                  {displayName}
                </p>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  {displayEmail}
                </p>
              </div>
              <div className="text-sm font-medium text-green-600 flex-shrink-0">
                +{formatOrderCurrency(sale.total_amount)}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
