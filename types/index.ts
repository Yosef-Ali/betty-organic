

// Application Product type that extends database type
export interface Product extends <DbProduct></DbProduct> {
  totalSales: number  // Make totalSales required
}

// Application Order type
export interface Order extends Omit<DbOrder, 'customer_id' | 'total_amount'> {
  customerId: string;
  totalAmount: number;
  customer: Customer | null;
  items: OrderItem[];
}

// Application OrderItem type
export interface OrderItem extends Omit<DbOrderItem, 'order_id' | 'product_id'> {
  orderId: string;
  productId: string;
  product?: Product | null;
}

// Application Customer type
export interface Customer extends Omit<DbCustomer, 'image_url'> {
  imageUrl: string | null;
}

// Dashboard specific types
export interface SalesReport {
  recentSales: {
    id: string;
    date: string;
    status: string;
    items: number;
    total: number;
  }[];
  totalAmount: number;
  totalOrders: number;
}

export interface MappedTransaction {
  id: string;
  amount: number;
  status: string;
  email: string;
}

// Re-export shared types
export type {
  OrderType,
  OrderStatus,
  CustomerStatus,
  OrderItem,
  Customer
}

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  status: CustomerStatus;
  imageUrl: string | null;
}
