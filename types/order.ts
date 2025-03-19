export type OrderItem = {
  id?: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
  };
  order_id?: string;
};

export type Order = {
  id: string;
  profile_id: string;
  customer_profile_id: string;
  total_amount: number;
  status: string;
  type: string;
  display_id?: string;
  created_at: string | null;
  updated_at?: string | null;
  order_items: OrderItem[];
  customer?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
};

// Type guard for Order
export function isOrder(order: any): order is Order {
  return !!order &&
    typeof order.id === 'string' &&
    typeof order.status === 'string' &&
    typeof order.total_amount === 'number';
}

// Response type for API calls
export type OrderResponse = {
  success: boolean;
  order?: Order;
  error?: Error | string;
};
