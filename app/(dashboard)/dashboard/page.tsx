'use client'

import { useEffect, useState } from 'react'
import { OverviewCard } from "@/components/OverviewCard"
import { RecentSales } from "@/components/RecentSales"
import { RecentOrders } from "@/components/RecentOrders"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, DollarSign, Package, Users } from 'lucide-react'
import { getTotalRevenue, getTotalCustomers, getTotalProducts, getTotalOrders } from '@/app/actions/supabase-actions'
import KnowledgeBaseEntry from '@/components/KnowledgeBaseEntry';  // Correct import
//import { getKnowledgeBaseEntries } from '@/app/actions/knowledgeBaseActions';

import AuthGuard from '@/components/AuthGuard'

export default function DashboardPage() {
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalCustomers, setTotalCustomers] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [entries, setEntries] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        const [revenue, customers, products, orders] = await Promise.all([
          getTotalRevenue(),
          getTotalCustomers(),
          getTotalProducts(),
          getTotalOrders()
        ])

        setTotalRevenue(revenue ?? 0)
        setTotalCustomers(customers ?? 0)
        setTotalProducts(products ?? 0)
        setTotalOrders(orders ?? 0)
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  return (
    <AuthGuard>
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
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : error ? (
                    <div className="text-red-600 bg-red-100 p-2 rounded">
                      Error loading data: {error}
                    </div>
                  ) : (
                    <RecentSales data={recentSales} />
                  )}
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
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : error ? (
                    <div className="text-red-600 bg-red-100 p-2 rounded">
                      Error loading data: {error}
                    </div>
                  ) : (
                    <RecentOrders data={recentOrders} />
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  )
}
