'use server';

import { createClient } from '@/lib/supabase/server';

export async function getApprovedTestimonials() {
  const supabase = await createClient();
  return supabase
    .from('testimonials')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false });
}
