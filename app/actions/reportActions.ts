"use server";

import { createClient } from "@/lib/supabase/server";
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

export async function getReportData(): Promise<ReportMetrics> {
  const supabase = createClient();
  const now = new Date();

  try {
    console.log('[ReportActions] Starting to fetch report data...');
    // Get daily sales for the last 30 days - include all orders first to debug
    const thirtyDaysAgo = subDays(now, 30);
    const { data: dailyData, error: dailyError } = await supabase
      .from('orders')
      .select('total_amount, created_at, status')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .lte('created_at', now.toISOString());
    
    console.log('[ReportActions] Daily data fetch result:', { 
      count: dailyData?.length || 0, 
      error: dailyError,
      sample: dailyData?.slice(0, 3) 
    });

    // Get weekly sales for the last 12 weeks
    const twelveWeeksAgo = subWeeks(now, 12);
    const { data: weeklyData } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', twelveWeeksAgo.toISOString())
      .lte('created_at', now.toISOString());

    // Get monthly sales for the last 12 months  
    const twelveMonthsAgo = subMonths(now, 12);
    const { data: monthlyData } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .gte('created_at', twelveMonthsAgo.toISOString())
      .lte('created_at', now.toISOString());

    // Get today's stats
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const { data: todayOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());
    
    console.log('[ReportActions] Today orders:', todayOrders?.length || 0);

    // Get yesterday's stats for comparison
    const yesterday = subDays(now, 1);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);
    const { data: yesterdayOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', yesterdayStart.toISOString())
      .lte('created_at', yesterdayEnd.toISOString());

    // Get this week's stats
    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);
    const { data: weekOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString());

    // Get last week's stats for comparison
    const lastWeek = subWeeks(now, 1);
    const lastWeekStart = startOfWeek(lastWeek);
    const lastWeekEnd = endOfWeek(lastWeek);
    const { data: lastWeekOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', lastWeekStart.toISOString())
      .lte('created_at', lastWeekEnd.toISOString());

    // Get this month's stats
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const { data: monthOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString());

    // Get last month's stats for comparison
    const lastMonth = subMonths(now, 1);
    const lastMonthStart = startOfMonth(lastMonth);
    const lastMonthEnd = endOfMonth(lastMonth);
    const { data: lastMonthOrders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', lastMonthStart.toISOString())
      .lte('created_at', lastMonthEnd.toISOString());
    
    console.log('[ReportActions] Data counts:', {
      daily: dailyData?.length || 0,
      weekly: weeklyData?.length || 0, 
      monthly: monthlyData?.length || 0,
      today: todayOrders?.length || 0,
      week: weekOrders?.length || 0,
      month: monthOrders?.length || 0
    });

    // Get top products
    const { data: topProducts } = await supabase
      .from('order_items')
      .select(`
        product_name,
        quantity,
        price,
        orders!inner(status, created_at)
      `)
      .gte('orders.created_at', subMonths(now, 1).toISOString())
      .in('orders.status', ['completed', 'confirmed']);

    // Get customer metrics
    const { data: allCustomers } = await supabase
      .from('profiles')
      .select('id, created_at')
      .eq('role', 'customer');

    const { data: newCustomers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'customer')
      .gte('created_at', monthStart.toISOString());

    // Process daily sales data
    const dailySales: SalesData[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(now, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const dayOrders = dailyData?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= dayStart && orderDate <= dayEnd;
      }) || [];

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
      
      const weekOrdersFiltered = weeklyData?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= weekStart && orderDate <= weekEnd;
      }) || [];

      const revenue = weekOrdersFiltered.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const orders = weekOrdersFiltered.length;
      
      weeklySales.push({
        date: format(weekStart, 'MMM dd'),
        revenue,
        orders,
        averageOrderValue: orders > 0 ? revenue / orders : 0
      });
    }

    // Process monthly sales data
    const monthlySales: SalesData[] = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      
      const monthOrdersFiltered = monthlyData?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= monthStart && orderDate <= monthEnd;
      }) || [];

      const revenue = monthOrdersFiltered.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const orders = monthOrdersFiltered.length;
      
      monthlySales.push({
        date: format(monthDate, 'MMM yyyy'),
        revenue,
        orders,
        averageOrderValue: orders > 0 ? revenue / orders : 0
      });
    }

    // Calculate stats with percentage changes
    const todayRevenue = todayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const yesterdayRevenue = yesterdayOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const todayPercentageChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    const weekRevenue = weekOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const lastWeekRevenue = lastWeekOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const weekPercentageChange = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

    const monthRevenue = monthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const lastMonthRevenue = lastMonthOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const monthPercentageChange = lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Process top products
    const productMap = new Map();
    topProducts?.forEach(item => {
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

    const topProductsProcessed = Array.from(productMap.values())
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5);

    // Calculate customer metrics
    const totalCustomers = allCustomers?.length || 0;
    const newCustomersThisMonth = newCustomers?.length || 0;
    const totalOrdersCount = (dailyData?.length || 0);
    const averageOrdersPerCustomer = totalCustomers > 0 ? totalOrdersCount / totalCustomers : 0;

    return {
      dailySales,
      weeklySales,
      monthlySales,
      todayStats: {
        revenue: todayRevenue,
        orders: todayOrders?.length || 0,
        averageOrderValue: (todayOrders?.length || 0) > 0 ? todayRevenue / (todayOrders?.length || 1) : 0,
        percentageChange: todayPercentageChange
      },
      weekStats: {
        revenue: weekRevenue,
        orders: weekOrders?.length || 0,
        averageOrderValue: (weekOrders?.length || 0) > 0 ? weekRevenue / (weekOrders?.length || 1) : 0,
        percentageChange: weekPercentageChange
      },
      monthStats: {
        revenue: monthRevenue,
        orders: monthOrders?.length || 0,
        averageOrderValue: (monthOrders?.length || 0) > 0 ? monthRevenue / (monthOrders?.length || 1) : 0,
        percentageChange: monthPercentageChange
      },
      topProducts: topProductsProcessed,
      customerMetrics: {
        totalCustomers,
        newCustomersThisMonth,
        averageOrdersPerCustomer
      }
    };

  } catch (error) {
    console.error('Error fetching report data:', error);
    // Return empty data structure as fallback
    return {
      dailySales: [],
      weeklySales: [],
      monthlySales: [],
      todayStats: { revenue: 0, orders: 0, averageOrderValue: 0, percentageChange: 0 },
      weekStats: { revenue: 0, orders: 0, averageOrderValue: 0, percentageChange: 0 },
      monthStats: { revenue: 0, orders: 0, averageOrderValue: 0, percentageChange: 0 },
      topProducts: [],
      customerMetrics: { totalCustomers: 0, newCustomersThisMonth: 0, averageOrdersPerCustomer: 0 }
    };
  }
}