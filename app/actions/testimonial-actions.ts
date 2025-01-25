'use server';

import { createClient } from '@/lib/supabase/server';
import { Testimonial } from '@/lib/types/supabase';

export async function getTestimonials() {
  const supabase = await createClient();
  return supabase
    .from('testimonials')
    .select('*')
    .order('created_at', { ascending: false });
}

export async function createTestimonial(testimonial: Omit<Testimonial, 'id'>) {
  const supabase = await createClient();
  return supabase.from('testimonials').insert(testimonial).select().single();
}

export async function updateTestimonial(testimonial: Testimonial) {
  const supabase = await createClient();
  return supabase
    .from('testimonials')
    .update(testimonial)
    .eq('id', testimonial.id)
    .select()
    .single();
}

export async function deleteTestimonial(id: string) {
  const supabase = await createClient();
  return supabase.from('testimonials').delete().eq('id', id);
}
