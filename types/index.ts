export type ProductStatus = 'ACTIVE' | 'INACTIVE';

export type Customer = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  status: 'active' | 'inactive';
  imageUrl?: string | null;  // Changed from image_url to imageUrl
};

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;  // Changed from image_url to imageUrl
  description: string | null;
  stock: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
  totalSales: number;
}

export type OrderType = 'sale' | 'refund' | 'credit'; // Define OrderType

export type Order = {
  id: string;
  customerId: string;
  status: string;
  type: OrderType;
  totalAmount: number;
  createdAt: string;
  customer?: Customer | null; // Optional customer information
  items?: OrderItem[]; // Optional order items
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product | null; // Optional product information
};

export type ExtendedOrder = Order & {
  customer: Customer | null;
};
