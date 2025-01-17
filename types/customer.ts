export interface Customer {
  id?: string;
  email: string;
  full_name: string;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
  image_url?: string | null;
  location?: string | null;
  phone?: string | null;
}
