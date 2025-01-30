import { createClient } from '@/lib/supabase/server';
import { TestimonialSection } from './testimonial-section';

export async function TestimonialsWrapper() {
  const supabase = await createClient();

  const { data: testimonials, error } = await supabase
    .from('testimonials')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading testimonials:', error);
    return null;
  }

  if (!testimonials || testimonials.length === 0) {
    return null;
  }

  return <TestimonialSection testimonials={testimonials} />;
}
