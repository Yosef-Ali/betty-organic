import { Customer } from '@/types/customer';

export interface OrderItem {
  id?: string;
  order_id?: string;
  price: number;
  product_id: string;
  product_name: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    imageUrl: string;
  } | null;
}

export interface Order {
  id: string;
  display_id?: string | null; // Make display_id optional and allow null
  profile_id: string;
  customer_profile_id: string;
  total_amount: number;
  status: string;
  type: string;
  created_at?: string | null;
  updated_at?: string | null;
  profiles?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  order_items: OrderItem[];
  order_number?: string;
}

export interface OrderWithProducts extends Order {
  order_items: OrderItem[];
}

export interface ExtendedOrder extends Order {
  id: string;
  display_id?: string | null;
  customerName: string;
  items: OrderItem[];
  status: string;
  total_amount: number;
  created_at?: string | null;
  profiles?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
}
