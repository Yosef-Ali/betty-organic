import { createClient, PostgrestSingleResponse } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-supabase-key';
const supabase = createClient(supabaseUrl, supabaseKey);

interface Product {
  availability: boolean;
  price: number;
}

interface Order {
  status: string;
}

export const checkProductAvailability = async (productName: string): Promise<boolean> => {
  const { data, error }: PostgrestSingleResponse<Product> = await supabase
    .from('products')
    .select('availability')
    .eq('name', productName)
    .single();

  if (error) {
    console.error('Error fetching product availability:', error);
    return false;
  }

  return data?.availability || false;
};

export const getProductPrice = async (productName: string): Promise<number | null> => {
  const { data, error }: PostgrestSingleResponse<Product> = await supabase
    .from('products')
    .select('price')
    .eq('name', productName)
    .single();

  if (error) {
    console.error('Error fetching product price:', error);
    return null;
  }

  return data?.price || null;
};

export const getOrderStatus = async (orderId: string): Promise<string | null> => {
  const { data, error }: PostgrestSingleResponse<Order> = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (error) {
    console.error('Error fetching order status:', error);
    return null;
  }

  return data?.status || null;
};