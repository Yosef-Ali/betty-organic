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
  items?: OrderItem[];
  delivery_cost?: number;
  coupon?: {
    code: string;
    discount_amount: number;
    discount_type: 'percentage' | 'fixed';
  };
  coupon_code?: string;
  discount_amount?: number;
  customer?: {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
    role: string;
  };

  // For backward compatibility with old code that uses customer_id
  customer_id?: string;
};

// Extended Order type that includes profile data for the orders data table
export type ExtendedOrder = Order & {
  profiles?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    phone?: string | null;
    avatar_url?: string | null;
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
