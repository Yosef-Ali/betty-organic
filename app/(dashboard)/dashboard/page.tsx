import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { RecentSales } from "@/components/dashboard/RecentSales";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { OrdersSummary } from "@/components/dashboard/OrdersSummary";
import ProductList from "@/components/dashboard/ProductList";
import { getRecentTransactions, type MappedTransaction } from "@/app/actions/getRecentTransactions";
import { getRecentSales, type SalesData } from "@/app/actions/getRecentSales";
import { getProducts } from "@/app/actions/productActions";
import type { Product } from "@/app/actions/productActions";  // Separate type import
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { DashboardProvider } from '@/providers/ContextProvider';

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies });

  try {
    console.log('Starting to fetch dashboard data...');

    // First check user authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Auth error:', userError);
      throw userError;
    }

    if (!user) {
      console.log('No authenticated user found');
      return <div>Please log in to view the dashboard</div>;
    }

    // Add type annotations to the variables
    let transactions: MappedTransaction[] = [];
    let salesData: SalesData | null = null;
    let products: Product[] = []; // This now uses the imported Product type

    // Fetch all data with individual error handling
    try {
      transactions = await getRecentTransactions() as MappedTransaction[];
      console.log('Transactions loaded:', transactions?.length || 0);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      transactions = [] as MappedTransaction[];
    }

    try {
      salesData = await getRecentSales();
      console.log('Sales data loaded:', salesData?.recentSales?.length || 0);
    } catch (error) {
      console.error('Failed to load sales:', error);
      salesData = { recentSales: [], totalSales: 0 };
    }

    try {
      const fetchedProducts = await getProducts();
      products = fetchedProducts || [];
      console.log('Products loaded:', products?.length || 0);
    } catch (error) {
      console.error('Failed to load products:', error);
      products = [];
    }

    return (
      <DashboardProvider value={{ sales: salesData, transactions, products }}>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="grid gap-4">
            {/* Header cards */}
            {user && <DashboardHeader user={user} />}

            {/* Main content grid */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
              {/* Recent sales card */}
              <div className="col-span-1 md:col-span-1 lg:col-span-4">
                {salesData ? (
                  <RecentSales data={salesData} />
                ) : (
                  <div>Loading sales data...</div>
                )}
              </div>

              {/* Recent transactions card */}
              <div className="col-span-1 md:col-span-1 lg:col-span-3">
                {transactions ? (
                  <RecentTransactions data={transactions} />
                ) : (
                  <div>Loading transactions...</div>
                )}
              </div>
            </div>

            {/* Products list section */}
            <div className="grid gap-4">
              {products ? (
                <ProductList initialProducts={products} />
              ) : (
                <div>Loading products...</div>
              )}
            </div>
          </div>
        </div>
      </DashboardProvider>
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="p-4">
        <h1>Something went wrong</h1>
        <p>Unable to load dashboard content. Please try again later.</p>
      </div>
    );
  }
}
