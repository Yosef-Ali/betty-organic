import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DashboardHeader />
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <RecentTransactions />
        <RecentSales />
      </div>
    </main>
  );
}
