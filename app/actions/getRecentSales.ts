import { createClient } from 'lib/supabase/client';

export interface SalesData {
  recentSales: {
    id: string;
    created_at: string | null;
    status: string;
    customer: { full_name: string };
    items: {
      id: string;
      quantity: number;
      price: number;
      product: {
        name: string;
        images: { url: string }[];
      };
    }[];
    totalAmount: number;
  }[];
  totalSales: number;
}

export async function getRecentSales(): Promise<SalesData> {
  const supabase = createClient();

  try {
    // Test database connection
    const { data: testOrder, error: testError } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('Database connection test failed:', testError);
      throw testError;
    }

    console.log('Database connection test successful:', testOrder);

    // First check if we have data in each table
    const { data: ordersCheck, count: ordersCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    const { data: customersCheck, count: customersCount } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    const { data: orderItemsCheck, count: orderItemsCount } = await supabase
      .from('order_item')
      .select('*', { count: 'exact', head: true });

    const { data: productsCheck, count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    console.log('Table row counts:', {
      orders: ordersCount || 0,
      customers: customersCount || 0,
      orderItems: orderItemsCount || 0,
      products: productsCount || 0
    });

    // If no orders exist, return empty data
    if (!ordersCount) {
      console.log('No orders found in database');
      return { recentSales: [], totalSales: 0 };
    }

    // Then try to fetch the actual sales data with explicit relationship
    const { data: recentSales, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        customer:customers!fk_customer(
          full_name
        ),
        items:order_item(
          id,
          quantity,
          price,
          product:products!order_item_product_id_fkey(
            name,
            imageUrl
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Query error:', error);
      throw error;
    }

    console.log('Recent sales data:', recentSales);

    if (!recentSales?.length) {
      console.log('No sales data found');
      return { recentSales: [], totalSales: 0 };
    }

    const mappedSales = recentSales.map(order => {
      // Ensure items is always an array
      const orderItems = Array.isArray(order.items) ? order.items :
        order.items ? [order.items] : [];

      // Handle customer data
      const customerName = Array.isArray(order.customer)
        ? order.customer[0]?.full_name || ''
        : order.customer?.full_name || '';

      return {
        id: String(order.id),
        created_at: order.created_at,
        status: String(order.status),
        customer: {
          full_name: String(customerName)
        },
        items: orderItems.map(item => ({
          id: String(item.id),
          quantity: Number(item.quantity),
          price: Number(item.price),
          product: {
            name: String(item.product?.name || ''),
            images: [{ url: String(item.product?.imageUrl || '') }]
          }
        })),
        totalAmount: orderItems.reduce((sum, item) =>
          sum + (Number(item.price) * Number(item.quantity)), 0)
      };
    });

    const totalSales = mappedSales.reduce((total, order) =>
      total + order.totalAmount, 0);

    console.log('Mapped sales:', {
      count: mappedSales.length,
      totalSales,
      firstItem: mappedSales[0]
    });

    return {
      recentSales: mappedSales,
      totalSales
    };

  } catch (error) {
    console.error('Failed to fetch recent sales:', error);
    throw error;
  }
}
