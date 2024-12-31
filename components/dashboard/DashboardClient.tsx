'use client'

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RecentSales } from "@/components/dashboard/RecentSales";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import { useEffect, useState } from "react";
import { getRecentTransactions } from "@/app/actions/getRecentTransactions";
import { getRecentSales } from "@/app/actions/getRecentSales";
import { Suspense } from "react";
import { MappedTransaction } from '@/app/actions/getRecentTransactions';

export function DashboardClient() {
  const [transactions, setTransactions] = useState<MappedTransaction[]>([]);
  const [sales, setSales] = useState({ recentSales: [], totalSales: 0 });

  useEffect(() => {
    async function fetchData() {
      const [transactionsData, salesData] = await Promise.all([
        getRecentTransactions(),
        getRecentSales()
      ]);
      setTransactions(transactionsData);
      setSales(salesData);
    }
    fetchData();
  }, []);

  return (
    <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
      <Suspense fallback={<div>Loading transactions...</div>}>
        <RecentTransactions data={transactions} />
      </Suspense>
      <Suspense fallback={<div>Loading sales...</div>}>
        <RecentSales data={sales} />
      </Suspense>
    </div>
  );
}
