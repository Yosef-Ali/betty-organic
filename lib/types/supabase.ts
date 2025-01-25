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

export type Testimonial = {
  id: string;
  author: string;
  role: string;
  content: string;
  approved: boolean;
  image_url: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
};
