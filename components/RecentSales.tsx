'use client';

import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRecentSales } from '@/app/actions/supabase-actions';

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

  useEffect(() => {
    async function fetchRecentSales() {
      const sales = await getRecentSales();
      setRecentSales(sales);
    }
    fetchRecentSales();
  }, []);

  return (
    <div className="space-y-8">
      {recentSales.map(sale => (
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
            +Br {sale.total_amount.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
