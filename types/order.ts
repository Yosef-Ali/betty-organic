import { Customer } from "@/types/customer";

export interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  type: "online" | "pos";
  created_at?: string | null;
  updated_at?: string | null;
  customer_info?: any;
  order_items: Array<{
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    product_name: string;
  }>;
  order_number?: string;
}

export interface OrderWithProducts extends Order {
  order_items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    product_name: string;
  }>;
}
