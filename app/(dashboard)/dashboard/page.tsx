// import { DashboardHeader } from 'components/dashboard/DashboardHeader';
// import { RecentSales } from 'components/dashboard/RecentSales';
// import { RecentTransactions } from 'components/dashboard/RecentTransactions';
// import { OrdersSummary } from 'components/dashboard/OrdersSummary';
// import ProductList from 'components/dashboard/ProductList';
// import { getRecentTransactions, type MappedTransaction } from 'app/actions/getRecentTransactions';
// import { getRecentSales, type SalesReport } from 'app/actions/getRecentSales';
// import { getProducts } from 'app/actions/productActions';
// import type { Product } from '@/lib/supabase/db.types';  // Update this import
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
// import { cookies } from 'next/headers';
// import { DashboardProvider } from 'providers/ContextProvider';

// export const dynamic = "force-dynamic";
// export const revalidate = 0;

// export default async function DashboardPage() {
//   const supabase = createServerComponentClient({ cookies });

//   try {
//     console.log('Starting to fetch dashboard data...');

//     // First check user authentication
//     const { data: { user }, error: userError } = await supabase.auth.getUser();

//     if (userError) {
//       console.error('Auth error:', userError);
//       throw userError;
//     }

//     if (!user) {
//       console.log('No authenticated user found');
//       return <div>Please log in to view the dashboard</div>;
//     }

//     // Add type annotations to the variables
//     let transactions: MappedTransaction[] = [];
//     let salesData: SalesReport | null = null;
//     let products: Product[] = [];

//     // Fetch all data with individual error handling
//     try {
//       transactions = await getRecentTransactions() as MappedTransaction[];
//       console.log('Transactions loaded:', transactions?.length || 0);
//     } catch (error) {
//       console.error('Failed to load transactions:', error);
//       transactions = [] as MappedTransaction[];
//     }

//     try {
//       salesData = await getRecentSales();
//       // Limit to 5 records right after fetching
//       if (salesData) {
//         salesData.recentSales = salesData.recentSales.slice(0, 5);
//       }
//       console.log('Sales data loaded:', salesData?.recentSales?.length || 0);
//     } catch (error) {
//       console.error('Failed to load sales:', error);
//       salesData = {
//         recentSales: [],
//         totalAmount: 0,    // Changed from totalSales to totalAmount
//         totalOrders: 0     // Added missing required property
//       };
//     }

//     try {
//       const fetchedProducts = await getProducts();
//       products = fetchedProducts || [];
//       console.log('Products loaded:', products?.length || 0);
//     } catch (error) {
//       console.error('Failed to load products:', error);
//       products = [];
//     }

//     return (
//       <DashboardProvider value={{ sales: salesData, transactions, products }}>
//         <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
//           <div className="grid gap-4">
//             {/* Header cards */}
//             {user && <DashboardHeader user={user} />}

//             {/* Main content grid */}
//             <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
//               {/* Recent sales card */}
//               <div className="col-span-1 md:col-span-1 lg:col-span-4">
//                 {salesData ? (
//                   <RecentSales data={{
//                     recentSales: salesData.recentSales,
//                     totalSales: salesData.totalAmount // Transform totalAmount to totalSales
//                   }} />
//                 ) : (
//                   <div>Loading sales data...</div>
//                 )}
//               </div>

//               {/* Recent transactions card */}
//               <div className="col-span-1 md:col-span-1 lg:col-span-3">
//                 {transactions ? (
//                   <RecentTransactions data={transactions} />
//                 ) : (
//                   <div>Loading transactions...</div>
//                 )}
//               </div>
//             </div>

//             {/* Products list section */}
//             <div className="grid gap-4">
//               {products ? (
//                 <ProductList initialProducts={products} />
//               ) : (
//                 <div>Loading products...</div>
//               )}
//             </div>
//           </div>
//         </div>
//       </DashboardProvider>
//     );
//   } catch (error) {
//     console.error("Dashboard error:", error);
//     return (
//       <div className="p-4">
//         <h1>Something went wrong</h1>
//         <p>Unable to load dashboard content. Please try again later.</p>
//       </div>
//     );
//   }
// }


'use client'

import { useEffect, useState } from 'react'
import { OverviewCard } from "@/components/OverviewCard"
import { RecentSales } from "@/components/RecentSales"
import { RecentOrders } from "@/components/RecentOrders"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, DollarSign, Package, Users } from 'lucide-react'
import { getTotalRevenue, getTotalCustomers, getTotalProducts, getTotalOrders } from '@/app/actions/supabase-actions'

export default function DashboardPage() {
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)

  useEffect(() => {
    async function fetchDashboardData() {
      const revenue = await getTotalRevenue()
      const customers = await getTotalCustomers()
      const products = await getTotalProducts()
      const orders = await getTotalOrders()

      setTotalRevenue(revenue)
      setTotalCustomers(customers ?? 0)
      setTotalProducts(products ?? 0)
      setTotalOrders(orders ?? 0)
    }
    fetchDashboardData()
  }, [])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics" disabled>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" disabled>
            Reports
          </TabsTrigger>
          <TabsTrigger value="notifications" disabled>
            Notifications
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <OverviewCard
              title="Total Revenue"
              value={`$${totalRevenue.toFixed(2)}`}
              icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
            />
            <OverviewCard
              title="Customers"
              value={totalCustomers.toString()}
              icon={<Users className="h-4 w-4 text-muted-foreground" />}
            />
            <OverviewCard
              title="Products"
              value={totalProducts.toString()}
              icon={<Package className="h-4 w-4 text-muted-foreground" />}
            />
            <OverviewCard
              title="Total Orders"
              value={totalOrders.toString()}
              icon={<CreditCard className="h-4 w-4 text-muted-foreground" />}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>
                  You made {totalOrders} sales this month.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  You have {totalOrders} total orders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentOrders />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

