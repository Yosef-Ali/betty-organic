"use client";

import { useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, ShoppingCart, DollarSign, Package } from "lucide-react";
import { SalesChart } from "@/components/charts/SalesChart";
import { CustomBarChart } from "@/components/charts/BarChart";
import { useReportData } from "@/hooks/useReportData";
import { useRealtime } from "@/lib/supabase/realtime-provider";
import { Skeleton } from "@/components/ui/skeleton";

export function ReportsContent() {
  const { reportData, loading, error, loadData } = useReportData();
  const { subscribeToOrders } = useRealtime();

  // Handle realtime order updates to refresh reports
  const handleOrderUpdate = useCallback((order: any, event: 'INSERT' | 'UPDATE' | 'DELETE') => {
    // Refresh report data when orders change
    loadData();
  }, [loadData]);

  useEffect(() => {
    // Initial fetch
    loadData();
    
    // Subscribe to realtime updates
    const unsubscribe = subscribeToOrders(handleOrderUpdate);
    
    return unsubscribe;
  }, [loadData, subscribeToOrders, handleOrderUpdate]);

  const formatCurrency = (amount: number) => `ETB ${amount.toFixed(0)}`;
  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[240px] rounded-lg" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-[400px] rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="p-4">
        <div className="text-red-600 bg-red-100 p-4 rounded">
          {error || 'Failed to load report data'}
        </div>
      </div>
    );
  }

  const { todayStats, weekStats, monthStats, dailySales, weeklySales, topProducts, customerMetrics } = reportData;

  return (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayStats.revenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {todayStats.percentageChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={todayStats.percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(todayStats.percentageChange)} from yesterday
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {todayStats.orders} orders • Avg: {formatCurrency(todayStats.averageOrderValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(weekStats.revenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {weekStats.percentageChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={weekStats.percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(weekStats.percentageChange)} from last week
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {weekStats.orders} orders • Avg: {formatCurrency(weekStats.averageOrderValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthStats.revenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              {monthStats.percentageChange >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
              )}
              <span className={monthStats.percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercentage(monthStats.percentageChange)} from last month
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {monthStats.orders} orders • Avg: {formatCurrency(monthStats.averageOrderValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Sales Trend</CardTitle>
            <CardDescription>Revenue over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart 
              data={dailySales} 
              dataKey="revenue" 
              title="Revenue"
              color="#8884d8"
              height={250}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Performance</CardTitle>
            <CardDescription>Orders per week for the last 12 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            <SalesChart 
              data={weeklySales} 
              dataKey="orders" 
              title="Orders"
              color="#82ca9d"
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Best selling products this month</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <CustomBarChart 
                data={topProducts.map(product => ({
                  name: product.product_name,
                  value: product.total_revenue
                }))}
                dataKey="value"
                title="Revenue"
                color="#ffc658"
                height={250}
                formatValue={formatCurrency}
              />
            ) : (
              <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                No product data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Insights</CardTitle>
            <CardDescription>Customer growth and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Customers</span>
                </div>
                <Badge variant="secondary">{customerMetrics.totalCustomers}</Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {customerMetrics.newCustomersThisMonth} new customers this month
              </div>
              <Progress 
                value={Math.min((customerMetrics.newCustomersThisMonth / Math.max(customerMetrics.totalCustomers, 1)) * 100, 100)} 
                className="h-2" 
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Avg Orders per Customer</span>
                <span className="text-sm font-bold">{customerMetrics.averageOrdersPerCustomer.toFixed(1)}</span>
              </div>
              <Progress 
                value={Math.min(customerMetrics.averageOrdersPerCustomer * 10, 100)} 
                className="h-2" 
              />
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold">{formatCurrency(monthStats.averageOrderValue)}</div>
                  <div className="text-xs text-muted-foreground">Avg Order Value</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">{monthStats.orders}</div>
                  <div className="text-xs text-muted-foreground">Orders This Month</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Breakdown</CardTitle>
          <CardDescription>Detailed analysis of sales performance across time periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">Today&apos;s Performance</div>
                  <div className="text-sm text-muted-foreground">
                    {todayStats.orders} orders • {formatCurrency(todayStats.revenue)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(todayStats.averageOrderValue)}</div>
                  <div className={`text-xs ${todayStats.percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(todayStats.percentageChange)}
                  </div>
                </div>
              </div>
              <Progress value={Math.abs(todayStats.percentageChange)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">This Week&apos;s Performance</div>
                  <div className="text-sm text-muted-foreground">
                    {weekStats.orders} orders • {formatCurrency(weekStats.revenue)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(weekStats.averageOrderValue)}</div>
                  <div className={`text-xs ${weekStats.percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(weekStats.percentageChange)}
                  </div>
                </div>
              </div>
              <Progress value={Math.abs(weekStats.percentageChange)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">This Month&apos;s Performance</div>
                  <div className="text-sm text-muted-foreground">
                    {monthStats.orders} orders • {formatCurrency(monthStats.revenue)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatCurrency(monthStats.averageOrderValue)}</div>
                  <div className={`text-xs ${monthStats.percentageChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatPercentage(monthStats.percentageChange)}
                  </div>
                </div>
              </div>
              <Progress value={Math.abs(monthStats.percentageChange)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}