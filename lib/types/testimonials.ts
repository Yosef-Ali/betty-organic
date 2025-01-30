// lib/types/testimonials.ts

export interface Testimonial {
  id: string;
  author: string;
  role: string;
  content: string;
  approved: boolean | null;
  image_url: string | null;
  rating: number | null;
  created_at: string | null;
  updated_at: string | null;
}

// If you need the database-specific types for insert/update operations
export interface TestimonialInsert extends Omit<Testimonial, 'id' | 'created_at' | 'updated_at'> {
  id?: string;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TestimonialUpdate extends Partial<TestimonialInsert> {
  id?: string;
}
