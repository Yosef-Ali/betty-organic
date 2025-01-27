export interface Testimonial {
  id: string;
  author: string;
  role: string;
  content: string;
  approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  role: 'admin' | 'sales' | 'customer';
  email?: string;
  full_name?: string;
  avatar_url?: string;
}
