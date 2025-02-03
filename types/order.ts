import { Customer } from '@/types/customer';
import { OrderItem } from '@/types/index';

export interface Order {
  id: string;
  profile_id: string;
  customer_profile_id: string;
  total_amount: number;
  status: string;
  type: string;
  created_at: string | null;
  updated_at: string | null;
  customer_info?: any;
  order_items: Array<{
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price: number;
    product_name: string;
  }>;
  order_number?: string;
}

export interface OrderWithProducts extends Order {
  order_items: Array<{
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    price: number;
    product_name: string;
  }>;
}

export interface ExtendedOrder {
  id: string;
  customerName: string;
  items: OrderItem[];
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
}
export interface OrderItemBase {
  id: string;
  order_id: string;
  price: number;
  product_id: string;
  product_name: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  order_id: string;
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
