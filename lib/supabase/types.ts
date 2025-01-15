export interface Customer {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  status: string;
  image_url: string | null;
  phone: string | null;
  location: string | null;
}
