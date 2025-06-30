'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from 'hooks/use-toast';
import { OverviewCard } from 'components/OverviewCard';
import { RecentSales } from 'components/RecentSales';
import { RecentOrders } from 'components/RecentOrders';
import { useRealtime } from '@/lib/supabase/realtime-provider';
import { ReportsContent } from '@/components/reports/ReportsContent';
import { NotificationsContent } from '@/components/notifications/NotificationsContent';
import { useAuth } from '@/components/providers/ImprovedAuthProvider';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from 'components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'components/ui/tabs';
import { Skeleton } from 'components/ui/skeleton';
import { CreditCard, DollarSign, Package, Users, ExternalLink } from 'lucide-react';
import { Button } from 'components/ui/button';
import Link from 'next/link';
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
  const { subscribeToOrders } = useRealtime();
  const { user, profile } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    try {
      if (loading) setLoading(true);
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

      setTotalRevenue(revenue);
      setTotalCustomers(customers);
      setTotalProducts(products);
      setTotalOrders(orders);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load dashboard data',
      );
      if (toast) {
        toast({
          title: 'Error',
          description:
            'Failed to load dashboard data. Please try again later.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []); // Remove dependencies to prevent recreation

  // Handle realtime order updates to refresh dashboard stats
  const handleOrderUpdate = useCallback((order: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
    // Refresh dashboard stats when orders change (revenue and order count)
    fetchDashboardData();
  }, []); // Remove fetchDashboardData dependency

  useEffect(() => {
    // Initial fetch
    fetchDashboardData();

    // Subscribe to realtime updates
    const unsubscribe = subscribeToOrders(handleOrderUpdate);

    return unsubscribe;
  }, [fetchDashboardData, subscribeToOrders, handleOrderUpdate]);

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

  // Debug logging
  console.log('🔍 [DashboardContent] Auth state:', {
    hasUser: !!user,
    hasProfile: !!profile,
    userEmail: user?.email,
    profileRole: profile?.role,
    profileRoleType: typeof profile?.role,
    profileObject: profile,
    roleCheck: profile?.role === 'admin' || profile?.role === 'sales',
    shouldShowTabs: (profile?.role === 'admin' || profile?.role === 'sales')
  });

  return (
    <div className="flex-1 space-y-3 p-3 sm:space-y-4 sm:p-4 md:p-8 pt-4 sm:pt-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
        {/* Debug info - hidden in production */}
        <div className="text-xs text-gray-500 hidden">
          Role: {profile?.role || 'No role'} | Tabs: {(profile?.role === 'admin' || profile?.role === 'sales') ? 'Visible' : 'Hidden'}
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-3 sm:space-y-4">
        <TabsList className={`grid w-full sm:w-auto sm:inline-flex ${profile?.role === 'sales' ? 'grid-cols-3' :
            profile?.role === 'admin' ? 'grid-cols-3' :
              'grid-cols-1'
          }`}>
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-4">
            {profile?.role === 'sales' ? 'Sales' : 'Overview'}
          </TabsTrigger>
          {/* Show different tabs based on role */}
          {profile?.role === 'admin' && (
            <TabsTrigger value="reports" className="text-xs sm:text-sm px-2 sm:px-4">Reports</TabsTrigger>
          )}
          {/* Show Notifications for admin and sales */}
          {(profile?.role === 'admin' || profile?.role === 'sales') && (
            <TabsTrigger value="notifications" className="text-xs sm:text-sm px-2 sm:px-4">Alerts</TabsTrigger>
          )}
          {/* Sales-specific tabs */}
          {profile?.role === 'sales' && (
            <TabsTrigger value="orders" className="text-xs sm:text-sm px-2 sm:px-4">Orders</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="overview" className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {profile?.role === 'sales' ? (
              // Sales-focused overview
              <>
                <OverviewCard
                  title="Pending Orders"
                  value={`${totalOrders} Orders`}
                  icon={<Package className="text-yellow-600" />}
                  description="Orders awaiting processing"
                />
                <OverviewCard
                  title="Active Customers"
                  value={`${totalCustomers}`}
                  icon={<Users className="text-blue-600" />}
                  description="Total registered customers"
                />
                <OverviewCard
                  title="Sales Revenue"
                  value={`ETB ${totalRevenue.toLocaleString()}`}
                  icon={<DollarSign className="text-green-600" />}
                  description="Total sales revenue"
                />
                <OverviewCard
                  title="Products Available"
                  value={`${totalProducts}`}
                  icon={<CreditCard className="text-purple-600" />}
                  description="Products in catalog"
                />
              </>
            ) : (
              // Admin overview (original)
              <>
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
              </>
            )}
          </div>
          {profile?.role === 'sales' ? (
            // Sales-focused content
            <div className="grid gap-3 sm:gap-4 grid-cols-1 xl:grid-cols-7">
              <Card className="xl:col-span-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg md:text-xl">Pending Orders</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Orders that need your attention and processing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <RecentOrders />
                </CardContent>
              </Card>
              <Card className="xl:col-span-3">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg md:text-xl">Customer Activity</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Recent customer orders and activity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <RecentSales />
                </CardContent>
              </Card>
            </div>
          ) : (
            // Admin content (original)
            <div className="grid gap-3 sm:gap-4 grid-cols-1 xl:grid-cols-7">
              <Card className="xl:col-span-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg md:text-xl">Recent Sales</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    You made {(totalOrders ?? 0).toLocaleString()} sales this
                    month.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <RecentSales />
                </CardContent>
              </Card>
              <Card className="xl:col-span-3">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg md:text-xl">Recent Orders</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    You have {(totalOrders ?? 0).toLocaleString()} total orders.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <RecentOrders />
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Show Reports for admin only */}
        {profile?.role === 'admin' && (
          <TabsContent value="reports" className="space-y-4">
            <ReportsContent />
          </TabsContent>
        )}

        {/* Sales-specific Order Management tab */}
        {profile?.role === 'sales' && (
          <TabsContent value="orders" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-1">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base sm:text-lg">Order Management</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Manage customer orders, update statuses, and track deliveries.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6">
                  <div className="space-y-4">
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                      <Card className="border-yellow-200 bg-yellow-50">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm text-yellow-800">Pending Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-900">{totalOrders}</div>
                          <p className="text-xs text-yellow-700 mt-1">Need processing</p>
                        </CardContent>
                      </Card>

                      <Card className="border-blue-200 bg-blue-50">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm text-blue-800">Processing Orders</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">0</div>
                          <p className="text-xs text-blue-700 mt-1">In progress</p>
                        </CardContent>
                      </Card>

                      <Card className="border-green-200 bg-green-50">
                        <CardHeader className="pb-2 sm:pb-3">
                          <CardTitle className="text-xs sm:text-sm text-green-800">Completed Today</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">0</div>
                          <p className="text-xs text-green-700 mt-1">Orders delivered</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="border rounded-lg p-3 sm:p-4">
                      <h3 className="text-sm sm:text-base font-medium mb-3">Quick Actions</h3>
                      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                        <Link href="/dashboard/orders">
                          <Button variant="outline" size="sm" className="justify-start w-full text-xs sm:text-sm">
                            <Package className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">View All Orders</span>
                            <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                          </Button>
                        </Link>
                        <Link href="/dashboard/customers">
                          <Button variant="outline" size="sm" className="justify-start w-full text-xs sm:text-sm">
                            <Users className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Customer List</span>
                            <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                          </Button>
                        </Link>
                        <Link href="/dashboard/orders?status=pending">
                          <Button variant="outline" size="sm" className="justify-start w-full text-xs sm:text-sm">
                            <CreditCard className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Process Payments</span>
                            <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                          </Button>
                        </Link>
                        <Link href="/dashboard/sales">
                          <Button variant="outline" size="sm" className="justify-start w-full text-xs sm:text-sm">
                            <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                            <span className="truncate">Sales Analytics</span>
                            <ExternalLink className="h-3 w-3 ml-auto flex-shrink-0" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Show Notifications for admin and sales */}
        {(profile?.role === 'admin' || profile?.role === 'sales') && (
          <TabsContent value="notifications" className="space-y-4">
            <NotificationsContent />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
