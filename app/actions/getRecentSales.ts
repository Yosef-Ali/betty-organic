import { createClient } from 'lib/supabase/client';
import { DbOrder, DbOrderItem } from '@/lib/supabase/db.types';

export interface SalesReport {
  recentSales: {
    id: string;
    date: string;
    status: string;
    items: number;
    total: number;
  }[];
  totalAmount: number;
  totalOrders: number;
}

export async function getRecentSales(): Promise<SalesReport> {
  const supabase = createClient();

  try {
    const { data: sales, error } = await supabase
      .from('orders')
      .select('id, created_at, status, items:order_item(quantity, price)')
      .order('created_at', { ascending: false })
      .limit(5) as {
        data: (DbOrder & {
          items: Pick<DbOrderItem, 'quantity' | 'price'>[]
        })[] | null;
        error: any
      };

    if (error) throw error;

    const recentSales = (sales || []).map(order => ({
      id: String(order.id),
      date: order.created_at || new Date().toISOString(),
      status: order.status,
      items: order.items?.length || 0,
      total: (order.items || []).reduce((sum, item) =>
        sum + (Number(item.price) * Number(item.quantity)), 0)
    }));

    return {
      recentSales,
      totalAmount: recentSales.reduce((sum, order) => sum + order.total, 0),
      totalOrders: recentSales.length
    };

  } catch (error) {
    console.error('Failed to fetch sales report:', error);
    throw error;
  }
}
