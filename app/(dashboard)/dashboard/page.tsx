import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { OrdersSummary } from "@/components/dashboard/OrdersSummary";
import ProductList from "@/components/dashboard/ProductList";
import { getRecentTransactions } from "@/app/actions/getRecentTransactions";
import { getRecentSales } from "@/app/actions/getRecentSales";
import { getProducts } from "@/app/actions/productActions";  // Fixed import
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  try {
    const [
      { data: { user } },
      transactions,
      salesData,
      products
    ] = await Promise.all([
      supabase.auth.getUser(),
      getRecentTransactions(),
      getRecentSales(),
      getProducts()
    ]);

    if (!user) return null;

    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>

        {/* Main dashboard grid */}
        <div className="grid gap-4">
          {/* Header cards */}
          <DashboardHeader user={user!} />

          {/* Orders summary section */}
          <OrdersSummary />

          {/* Main content grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {/* Recent sales card - spans 3 columns */}
            <div className="col-span-4">
              <RecentSales data={salesData} />
            </div>

            {/* Recent transactions card - spans 3 columns */}
            <div className="col-span-3">
              <RecentTransactions data={transactions} />
            </div>
          </div>

          {/* Products list section */}
          <div className="grid gap-4">
            <ProductList initialProducts={products} />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading dashboard data:", error);
    return null;
  }
}
