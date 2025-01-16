import { Customer } from "@/types/customer";

export interface Order {
  customer_id: string;
  total_amount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  type: "online" | "pos";
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  orderNumber: string;
}

export interface OrderWithProducts extends Order {
  order_items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    product_name: string;
  }>;
}
