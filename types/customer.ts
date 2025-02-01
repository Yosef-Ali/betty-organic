export interface Customer {
  id: string;
  email: string;
  name?: string;
  status: string;
  role: 'admin' | 'sales' | 'customer';
  auth_provider?: string | null;
  created_at: string | null;
  updated_at: string | null;
  image_url?: string | null;
  location?: string | null;
  phone?: string | null;
}

export interface CustomerWithOrders extends Customer {
  orders?: Array<{
    id: string;
    customerId: string;
    product: string;
    amount: number;
    status: string;
    createdAt: string;
    updatedAt?: string;
  }>;
  imageUrl?: string;
  fullName?: string;
  createdAt?: string;
  role?: 'admin' | 'sales' | 'customer';
  created_at?: string | null;
  updated_at?: string | null;
}
