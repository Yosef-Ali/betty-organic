'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from '@/lib/utils';

type TimeFrame = 'week' | 'month' | 'year';

interface TopProduct {
  name: string;
  revenue: number;
}

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  topProducts: TopProduct[];
}

interface MockData {
  week: SalesData;
  month: SalesData;
  year: SalesData;
}

export default function ReportsPage() {
  const [timeframe, setTimeframe] = useState<TimeFrame>('week');
  const [salesData, setSalesData] = useState<SalesData>({
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    topProducts: [],
  });

  // Fetch sales data based on timeframe
  useEffect(() => {
    // TODO: Implement actual data fetching from your backend
    // This is just mock data for demonstration
    const mockData: MockData = {
      week: {
        totalRevenue: 15000,
        totalOrders: 45,
        averageOrderValue: 333.33,
        topProducts: [
          { name: 'Organic Tomatoes', revenue: 2500 },
          { name: 'Fresh Herbs', revenue: 2000 },
          { name: 'Organic Spices', revenue: 1800 },
        ],
      },
      month: {
        totalRevenue: 52000,
        totalOrders: 180,
        averageOrderValue: 288.89,
        topProducts: [
          { name: 'Organic Tomatoes', revenue: 8500 },
          { name: 'Fresh Herbs', revenue: 7200 },
          { name: 'Organic Spices', revenue: 6800 },
        ],
      },
      year: {
        totalRevenue: 620000,
        totalOrders: 2160,
        averageOrderValue: 286.11,
        topProducts: [
          { name: 'Organic Tomatoes', revenue: 102000 },
          { name: 'Fresh Herbs', revenue: 86400 },
          { name: 'Organic Spices', revenue: 81600 },
        ],
      },
    };

    setSalesData(mockData[timeframe]);
  }, [timeframe]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Sales Reports</h2>
        <div className="flex items-center space-x-2">
          <Select value={timeframe} onValueChange={(value: TimeFrame) => setTimeframe(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesData.totalRevenue)}</div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last {timeframe}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesData.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  +15% from last {timeframe}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesData.averageOrderValue)}</div>
                <p className="text-xs text-muted-foreground">
                  +4.1% from last {timeframe}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>
                  Sales performance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* TODO: Add chart component here */}
                <div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
                  Chart placeholder
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Products</CardTitle>
                <CardDescription>Best selling products by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesData.topProducts.map((product, index) => (
                    <div key={index} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(product.revenue)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>
                Detailed analysis of product sales and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO: Add product-specific reports */}
              <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg">
                Product analysis coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Insights</CardTitle>
              <CardDescription>
                Analysis of customer behavior and purchasing patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* TODO: Add customer-specific reports */}
              <div className="h-[400px] flex items-center justify-center border-2 border-dashed rounded-lg">
                Customer insights coming soon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
