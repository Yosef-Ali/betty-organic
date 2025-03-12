'use client';

import { useEffect, useState } from 'react';
import { useToast } from 'hooks/use-toast';
import { OverviewCard } from 'components/OverviewCard';
import { RecentSales } from 'components/RecentSales';
import { RecentOrders } from 'components/RecentOrders';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Skeleton } from 'components/ui/skeleton';
import { CreditCard, DollarSign, Package, Users } from 'lucide-react';
import {
  getTotalRevenue,
  getTotalCustomers,
  getTotalProducts,
  getTotalOrders,
} from 'app/actions/supabase-actions';
import { Progress } from 'components/ui/progress';

export default function DashboardContent() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let isMounted = true;

    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const [revenue, customers, products, orders] = await Promise.all([
          getTotalRevenue()
            .catch(e => {
              console.error('Revenue fetch error:', e);
              return 0;
            })
            .then(res => Number(res) || 0),
          getTotalCustomers()
            .catch(e => {
              console.error('Customers fetch error:', e);
              return 0;
            })
            .then(res => Number(res) || 0),
          getTotalProducts()
            .catch(e => {
              console.error('Products fetch error:', e);
              return 0;
            })
            .then(res => Number(res) || 0),
          getTotalOrders()
            .catch(e => {
              console.error('Orders fetch error:', e);
              return 0;
            })
            .then(res => Number(res) || 0),
        ]);

        if (isMounted) {
          setTotalRevenue(revenue);
          setTotalCustomers(customers);
          setTotalProducts(products);
          setTotalOrders(orders);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Failed to load dashboard data',
          );
          toast({
            title: 'Error',
            description:
              'Failed to load dashboard data. Please try again later.',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  if (loading) {
    return (
      <div className="flex-1 space-y-4  md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[110px] rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <Skeleton className="h-[400px] rounded-lg" />
            </div>
            <div className="col-span-3">
              <Skeleton className="h-[400px] rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 bg-red-100 p-4 rounded">
          Error loading dashboard data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="analytics" disabled>
            Analytics
          </TabsTrigger>
          <TabsTrigger value="notifications" disabled>
            Notifications
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <OverviewCard
              title="Total Revenue"
              value={`ETB ${totalRevenue.toLocaleString()}`}
              icon={<DollarSign />}
            />
            <OverviewCard
              title="Total Customers"
              value={`${totalCustomers.toLocaleString()}`}
              icon={<Users />}
            />
            <OverviewCard
              title="Total Products"
              value={`${totalProducts.toLocaleString()}`}
              icon={<Package />}
            />
            <OverviewCard
              title="Total Orders"
              value={`${totalOrders.toLocaleString()}`}
              icon={<CreditCard />}
            />
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Sales</CardTitle>
                <CardDescription>
                  You made {(totalOrders ?? 0).toLocaleString()} sales this
                  month.
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
                  You have {(totalOrders ?? 0).toLocaleString()} total orders.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecentOrders />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Daily Sales</CardTitle>
                <CardDescription>Sales performance for today</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">ETB {(totalRevenue / 30).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  +12% from yesterday
                </div>
                <div className="h-[200px] mt-4 flex items-center justify-center border-2 border-dashed rounded-lg">
                  Daily sales chart coming soon
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Sales</CardTitle>
                <CardDescription>Sales performance this week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">ETB {(totalRevenue / 4).toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  +8% from last week
                </div>
                <div className="h-[200px] mt-4 flex items-center justify-center border-2 border-dashed rounded-lg">
                  Weekly sales chart coming soon
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Sales</CardTitle>
                <CardDescription>Sales performance this month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">ETB {totalRevenue.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  +15% from last month
                </div>
                <div className="h-[200px] mt-4 flex items-center justify-center border-2 border-dashed rounded-lg">
                  Monthly sales chart coming soon
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Breakdown</CardTitle>
              <CardDescription>Detailed analysis of sales performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium">Today&apos;s Orders</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(totalOrders / 30)} orders
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">ETB {(totalRevenue / 30).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">+12%</div>
                    </div>
                  </div>
                  <Progress value={12} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium">This Week&apos;s Orders</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(totalOrders / 4)} orders
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">ETB {(totalRevenue / 4).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">+8%</div>
                    </div>
                  </div>
                  <Progress value={8} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="flex-1">
                      <div className="text-sm font-medium">This Month&apos;s Orders</div>
                      <div className="text-sm text-muted-foreground">
                        {totalOrders} orders
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">ETB {totalRevenue.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">+15%</div>
                    </div>
                  </div>
                  <Progress value={15} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
