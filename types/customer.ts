export interface Customer {
  id: string;
  email: string;
  full_name: string;
  status: string;
  role: 'admin' | 'sales' | 'customer';
  auth_provider?: string | null;
  created_at: string | null;
  updated_at: string | null;
  image_url?: string | null;
  location?: string | null;
  phone?: string | null;
}
