'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { TestimonialData } from '@/components/testimonials/TestimonialFormSchema';
import { getCurrentUser } from './auth';
import { redirect } from 'next/navigation';

export async function createTestimonial(
  formData: FormData,
): Promise<TestimonialData> {
  const { user, isAdmin } = await getCurrentUser();

  if (!user || !isAdmin) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  try {
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const content = formData.get('content') as string;
    const status = formData.get('status') as string;

    if (!name || typeof name !== 'string') {
      throw new Error('Name is required');
    }

    if (!content || typeof content !== 'string') {
      throw new Error('Content is required');
    }

    const testimonialId = uuidv4();
    const now = new Date().toISOString();

    const { data: newTestimonial, error: insertError } = await supabase
      .from('testimonials')
      .insert({
        id: testimonialId,
        author: name,
        role: role || '',
        content,
        approved: status === 'active',
        created_at: now,
        updated_at: now,
      })
      .select('id, author, role, content, approved, created_at, updated_at')
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    if (!newTestimonial) {
      throw new Error('No testimonial data returned after creation');
    }

    revalidatePath('/dashboard/settings/testimonials');
    return newTestimonial;
  } catch (error: any) {
    console.error('Error creating testimonial:', error);
    throw new Error(
      'Failed to create testimonial: ' + (error.message || 'Unknown error'),
    );
  }
}

export async function updateTestimonial(
  id: string,
  formData: FormData,
): Promise<TestimonialData> {
  const { user, isAdmin } = await getCurrentUser();

  if (!user || !isAdmin) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  try {
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const content = formData.get('content') as string;
    const status = formData.get('status') as string;

    if (!name || !content) {
      throw new Error('Name and content are required');
    }

    const updates = {
      author: name,
      role: role || '',
      content,
      approved: status === 'active',
      updated_at: new Date().toISOString(),
    };

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .update(updates)
      .eq('id', id)
      .select('id, author, role, content, approved, created_at, updated_at')
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(`Failed to update testimonial: ${error.message}`);
    }

    if (!testimonial) {
      throw new Error('Testimonial not found');
    }

    revalidatePath('/dashboard/settings/testimonials');
    return testimonial;
  } catch (error: any) {
    console.error('Error updating testimonial:', error);
    throw new Error(error.message || 'Failed to update testimonial');
  }
}

export async function deleteTestimonial(id: string) {
  const { user, isAdmin } = await getCurrentUser();

  if (!user || !isAdmin) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  try {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);

    if (error) {
      console.error('Delete error:', error);
      throw new Error('Failed to delete testimonial');
    }

    revalidatePath('/dashboard/settings/testimonials');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete testimonial:', error);
    return { success: false, error: 'Failed to delete testimonial' };
  }
}

export async function getTestimonials(): Promise<TestimonialData[]> {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, author, role, content, approved, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching testimonials:', error);
      throw new Error('Failed to fetch testimonials: ' + error.message);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTestimonials:', error);
    throw new Error('Failed to fetch testimonials. Please try again later.');
  }
}

export async function getTestimonial(
  id: string,
): Promise<TestimonialData | null> {
  const supabase = await createClient();
  try {
    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .select('id, author, role, content, approved, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching testimonial:', error);
      throw error;
    }

    return testimonial;
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    throw error; // Let the page handle the error
  }
}
