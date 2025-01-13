import { Customer } from "@/types/customer";

export interface Order {
  customer_id: string;
  customerId: string;
  status: "pending" | "processing" | "confirmed" | "completed" | "cancelled";
  total_amount: number;
  totalAmount: number;
  type: "store" | "online";
  items: Array<{
    product_id: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  customerInfo: {
    name: string;
    email: string;
  };
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
