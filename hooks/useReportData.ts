"use client";

import { useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";

export interface SalesData {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export interface ReportMetrics {
  dailySales: SalesData[];
  weeklySales: SalesData[];
  monthlySales: SalesData[];
  todayStats: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    percentageChange: number;
  };
  weekStats: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    percentageChange: number;
  };
  monthStats: {
    revenue: number;
    orders: number;
    averageOrderValue: number;
    percentageChange: number;
  };
  topProducts: Array<{
    product_name: string;
    total_quantity: number;
    total_revenue: number;
  }>;
  customerMetrics: {
    totalCustomers: number;
    newCustomersThisMonth: number;
    averageOrdersPerCustomer: number;
  };
}

export function useReportData() {
  const [reportData, setReportData] = useState<ReportMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = useCallback(async (): Promise<ReportMetrics> => {
    const supabase = createClient();
    const now = new Date();

    try {
      console.log('[useReportData] Starting to fetch report data...');
      
      // Get all orders from the last 12 months (we'll filter client-side)
      const twelveMonthsAgo = subMonths(now, 12);
      const { data: allOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total_amount, created_at, status, customer_profile_id')
        .gte('created_at', twelveMonthsAgo.toISOString())
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('[useReportData] Error fetching orders:', ordersError);
        throw new Error(`Database error: ${ordersError.message}`);
      }

      console.log('[useReportData] Fetched orders:', allOrders?.length || 0);

      // Get order items for product analysis
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          product_name,
          quantity,
          price,
          order_id,
          orders!inner(status, created_at)
        `)
        .gte('orders.created_at', subMonths(now, 1).toISOString());

      if (itemsError) {
        console.error('[useReportData] Error fetching order items:', itemsError);
      }

      // Get customer data
      const { data: customers, error: customersError } = await supabase
        .from('profiles')
        .select('id, created_at')
        .eq('role', 'customer');

      if (customersError) {
        console.error('[useReportData] Error fetching customers:', customersError);
      }

      // Filter orders (include all statuses for now, we can filter later if needed)
      const validOrders = allOrders?.filter(order => 
        order.total_amount && order.total_amount > 0
      ) || [];

      console.log('[useReportData] Valid orders after filtering:', validOrders.length);

      // Process daily sales data
      const dailySales: SalesData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = subDays(now, i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        
        const dayOrders = validOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= dayStart && orderDate <= dayEnd;
        });

        const revenue = dayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const orders = dayOrders.length;
        
        dailySales.push({
          date: format(date, 'MMM dd'),
          revenue,
          orders,
          averageOrderValue: orders > 0 ? revenue / orders : 0
        });
      }

      // Process weekly sales data
      const weeklySales: SalesData[] = [];
      for (let i = 11; i >= 0; i--) {
        const weekDate = subWeeks(now, i);
        const weekStart = startOfWeek(weekDate);
        const weekEnd = endOfWeek(weekDate);
        
        const weekOrders = validOrders.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= weekStart && orderDate <= weekEnd;
        });

        const revenue = weekOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const orders = weekOrders.length;
        
        weeklySales.push({
          date: format(weekStart, 'MMM dd'),
          revenue,
          orders,
          averageOrderValue: orders > 0 ? revenue / orders : 0
        });
      }

      // Calculate today's stats
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const todayOrders = validOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= todayStart && orderDate <= todayEnd;
      });

      const yesterdayStart = startOfDay(subDays(now, 1));
      const yesterdayEnd = endOfDay(subDays(now, 1));
      const yesterdayOrders = validOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= yesterdayStart && orderDate <= yesterdayEnd;
      });

      const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const yesterdayRevenue = yesterdayOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const todayPercentageChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

      // Calculate week stats
      const weekStart = startOfWeek(now);
      const weekEnd = endOfWeek(now);
      const weekOrders = validOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= weekStart && orderDate <= weekEnd;
      });

      const lastWeekStart = startOfWeek(subWeeks(now, 1));
      const lastWeekEnd = endOfWeek(subWeeks(now, 1));
      const lastWeekOrders = validOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= lastWeekStart && orderDate <= lastWeekEnd;
      });

      const weekRevenue = weekOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const lastWeekRevenue = lastWeekOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const weekPercentageChange = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

      // Calculate month stats
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);
      const monthOrders = validOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const lastMonthOrders = validOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
      });

      const monthRevenue = monthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const monthPercentageChange = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

      // Process top products
      const productMap = new Map();
      orderItems?.forEach(item => {
        const key = item.product_name;
        if (productMap.has(key)) {
          const existing = productMap.get(key);
          existing.total_quantity += item.quantity || 0;
          existing.total_revenue += (item.price || 0) * (item.quantity || 0);
        } else {
          productMap.set(key, {
            product_name: item.product_name,
            total_quantity: item.quantity || 0,
            total_revenue: (item.price || 0) * (item.quantity || 0)
          });
        }
      });

      const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);

      // Calculate customer metrics
      const totalCustomers = customers?.length || 0;
      const newCustomersThisMonth = customers?.filter(customer => {
        const customerDate = new Date(customer.created_at);
        return customerDate >= monthStart && customerDate <= monthEnd;
      }).length || 0;
      
      const totalOrdersCount = validOrders.length;
      const averageOrdersPerCustomer = totalCustomers > 0 ? totalOrdersCount / totalCustomers : 0;

      const result: ReportMetrics = {
        dailySales,
        weeklySales,
        monthlySales: [], // We can add this later if needed
        todayStats: {
          revenue: todayRevenue,
          orders: todayOrders.length,
          averageOrderValue: todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0,
          percentageChange: todayPercentageChange
        },
        weekStats: {
          revenue: weekRevenue,
          orders: weekOrders.length,
          averageOrderValue: weekOrders.length > 0 ? weekRevenue / weekOrders.length : 0,
          percentageChange: weekPercentageChange
        },
        monthStats: {
          revenue: monthRevenue,
          orders: monthOrders.length,
          averageOrderValue: monthOrders.length > 0 ? monthRevenue / monthOrders.length : 0,
          percentageChange: monthPercentageChange
        },
        topProducts,
        customerMetrics: {
          totalCustomers,
          newCustomersThisMonth,
          averageOrdersPerCustomer
        }
      };

      console.log('[useReportData] Final result:', {
        dailySalesCount: result.dailySales.length,
        todayRevenue: result.todayStats.revenue,
        weekRevenue: result.weekStats.revenue,
        monthRevenue: result.monthStats.revenue,
        totalOrders: validOrders.length
      });

      return result;

    } catch (err) {
      console.error('[useReportData] Error:', err);
      throw err;
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchReportData();
      setReportData(data);
    } catch (err) {
      console.error('Error loading report data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [fetchReportData]);

  return {
    reportData,
    loading,
    error,
    loadData,
    refetch: loadData
  };
}