import { Database } from '@/types/supabase';

export type ExtendedOrder = Database['public']['Tables']['orders']['Row'] & {
  profile: {
    id: string;
    full_name: string;
    email: string;
  };
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    price: number;
  }>;
};
