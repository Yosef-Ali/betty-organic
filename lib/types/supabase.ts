export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  imageUrl: string | null;
  active: boolean;
  createdat: string;
  updatedat: string;
  created_by?: string;
  updated_by?: string;
}

export interface Profile {
  id: string;
  role: 'admin' | 'sales' | 'customer';
  email?: string;
  full_name?: string;
  avatar_url?: string;
}
