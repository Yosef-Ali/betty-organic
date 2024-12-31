import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { Suspense } from "react";
import { getRecentTransactions } from "../actions/getRecentTransactions";
import { getRecentSales } from "../actions/getRecentSales";

export default async function DashboardPage() {
  // Fetch data server-side
  const initialData = await Promise.all([
    getRecentTransactions(),
    getRecentSales()
  ]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DashboardHeader />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <Suspense fallback={<div>Loading transactions...</div>}>
          <RecentTransactions data={initialData[0]} />
        </Suspense>
        <Suspense fallback={<div>Loading sales...</div>}>
          <RecentSales data={initialData[1]} />
        </Suspense>
      </div>
    </main>
  );
}
