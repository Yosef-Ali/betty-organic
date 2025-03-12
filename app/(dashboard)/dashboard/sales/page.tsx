import { Suspense } from 'react';
import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import SalesPage from '@/components/SalesPage';
import { SalesPageSkeleton } from '@/components/sales/SalesPageSkeleton';
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { OrderHistory } from '@/components/OrderHistory';

export default async function SalesDashboardPage() {
  const userData = await getCurrentUser();

  if (!userData) {
    redirect('/auth/login');
  }

  const formattedUser = {
    id: userData.user.id,
    user_metadata: {
      full_name: userData.user.user_metadata?.full_name,
    },
    email: userData.user.email,
    profile: {
      id: userData.profile.id,
      role: userData.profile.role,
    },
    isAdmin: userData.isAdmin,
  };

  return (
    <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Sales Dashboard</h2>
          <p className="text-muted-foreground">
            Manage sales and track inventory
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
            />
          </div>
        </div>

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <Suspense fallback={<SalesPageSkeleton />}>
                  <SalesPage user={formattedUser} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardContent className="p-6">
                <Suspense fallback={<SalesPageSkeleton />}>
                  <OrderHistory userId={formattedUser.id} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory">
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  Inventory management coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
