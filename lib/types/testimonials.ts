export interface Testimonial {
  id: string;
  author: string;
  content: string;
  role: string;
  image_url: string | null;
  rating: number;
  approved: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}
