export type OrderItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  product?: {
    name: string;
  };
};

export type Order = {
  id: string;
  display_id?: string;
  status: string;
  type: string;
  created_at: string;
  updated_at?: string;
  total_amount: number;
  customer: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  items: OrderItem[];
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
  error?: string;
};
