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

export type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null; // Updated to allow undefined or null
  stock: number;
  totalSales: number; // Added totalSales property
  createdAt: string;
  // Add other relevant fields if necessary
};

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
