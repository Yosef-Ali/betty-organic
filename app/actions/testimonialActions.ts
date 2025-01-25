'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

export async function createTestimonial({
  author_name,
  role,
  content,
  approved = false,
  image_url = null,
}: {
  author_name: string;
  role: string;
  content: string;
  approved?: boolean;
  image_url?: string | null;
}) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from('testimonials').insert({
      id: uuidv4(),
      author_name,
      role,
      content,
      approved,
      image_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    revalidatePath('/dashboard/testimonials');
    return { success: true };
  } catch (error: any) {
    console.error('Error creating testimonial:', error);
    return { error: error.message || 'Failed to create testimonial' };
  }
}

export async function getTestimonials() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', JSON.stringify(error, null, 2));
      throw new Error(
        error.message || 'An error occurred while fetching testimonials',
      );
    }
    return data;
  } catch (error: any) {
    console.error('Unexpected error:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'An unexpected error occurred');
  }
}

export async function getApprovedTestimonials() {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', JSON.stringify(error, null, 2));
      throw new Error(
        error.message || 'An error occurred while fetching testimonials',
      );
    }
    return { data };
  } catch (error: any) {
    console.error('Unexpected error:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'An unexpected error occurred');
  }
}

export async function getTestimonialById(id: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', JSON.stringify(error, null, 2));
      throw new Error(
        error.message || 'An error occurred while fetching testimonial',
      );
    }
    return data;
  } catch (error: any) {
    console.error('Unexpected error:', JSON.stringify(error, null, 2));
    throw new Error(error.message || 'An unexpected error occurred');
  }
}

export async function updateTestimonial(
  id: string,
  {
    author_name,
    role,
    content,
    approved,
    image_url,
  }: {
    author_name: string;
    role: string;
    content: string;
    approved: boolean;
    image_url?: string | null;
  },
) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from('testimonials')
      .update({
        author_name,
        role,
        content,
        approved,
        image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/testimonials');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating testimonial:', error);
    return { error: error.message || 'Failed to update testimonial' };
  }
}

export async function deleteTestimonial(id: string) {
  const supabase = await createClient();
  try {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/testimonials');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting testimonial:', error);
    throw new Error(error.message || 'Failed to delete testimonial');
  }
}

export async function toggleApproval(id: string, approved: boolean) {
  const supabase = await createClient();
  try {
    const { error } = await supabase
      .from('testimonials')
      .update({ approved })
      .eq('id', id);

    if (error) throw error;

    revalidatePath('/dashboard/testimonials');
    return { success: true };
  } catch (error: any) {
    console.error('Error toggling testimonial approval:', error);
    throw new Error(error.message || 'Failed to update testimonial approval');
  }
}
