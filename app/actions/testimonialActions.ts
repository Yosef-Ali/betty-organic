'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from './auth';
import { redirect } from 'next/navigation';
import { Tables } from '@/lib/supabase/database.types';

// Replace TestimonialData with the correct type
type TestimonialData = Tables<'testimonials'>;

export async function createTestimonial(
  formData: FormData,
): Promise<TestimonialData> {
  const authData = await getCurrentUser();

  if (!authData?.user) {
    redirect('/auth/login');
  }

  const { user, profile, isAdmin } = authData;
  const isSales = profile?.role === 'sales';
  const supabase = await createClient();

  try {
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const content = formData.get('content') as string;
    const status = formData.get('status') as string;
    const image_url = formData.get('image_url') as string;
    const rating = parseInt(formData.get('rating') as string, 10);

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
        image_url: image_url || null,
        rating: rating || 5,
        created_at: now,
        updated_at: now,
      })
      .select(
        'id, author, role, content, approved, image_url, rating, created_at, updated_at',
      )
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
  const authData = await getCurrentUser();

  if (!authData?.user) {
    redirect('/auth/login');
  }

  const { user, profile, isAdmin } = authData;
  const isSales = profile?.role === 'sales';

  // Only allow admins and the original creator (if they're sales) to update
  const supabase = await createClient();
  const { data: testimonial } = await supabase
    .from('testimonials')
    .select('id, author, content, role, image_url, rating, approved, created_at, updated_at')
    .eq('id', id)
    .single();

  if (!isAdmin && !isSales) {
    throw new Error('Unauthorized to update this testimonial');
  }

  try {
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const content = formData.get('content') as string;
    const status = formData.get('status') as string;
    const image_url = formData.get('image_url') as string;
    const rating = parseInt(formData.get('rating') as string, 10);

    if (!name || !content) {
      throw new Error('Name and content are required');
    }

    const updates = {
      author: name,
      role: role || '',
      content,
      approved: status === 'active',
      image_url: image_url || null,
      rating: rating || 5,
      updated_at: new Date().toISOString(),
    };

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .update(updates)
      .eq('id', id)
      .select(
        'id, author, role, content, approved, image_url, rating, created_at, updated_at',
      )
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
  const authData = await getCurrentUser();
  if (!authData?.user) {
    redirect('/auth/login');
  }
  const { user } = authData;
  const isAdmin = authData.profile?.role === 'admin';

  if (!user || !isAdmin) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  try {
    // Get testimonial data to delete image if exists
    const { data: testimonial } = await supabase
      .from('testimonials')
      .select('image_url')
      .eq('id', id)
      .single();

    // Delete image from storage if exists
    if (testimonial?.image_url) {
      const path = testimonial.image_url.split('/').pop(); // Get filename from URL
      if (path) {
        await supabase.storage
          .from('testimonials')
          .remove([`testimonials/${path}`]);
      }
    }

    // Delete testimonial record
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
    // Modified the select statement to explicitly include all fields
    const { data, error } = await supabase
      .from('testimonials')
      .select(`
        id,
        author,
        role,
        content,
        approved,
        image_url,
        rating,
        created_at,
        updated_at
      `)
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

export async function getTestimonialById(id: string) {
  const supabase = await createClient();
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return { success: false, error: 'Failed to fetch testimonial' };
  }
}

export async function toggleApproval(id: string, approved: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('testimonials')
    .update({ approved })
    .eq('id', id)
    .select('id, approved')
    .single();

  if (error) {
    console.error('Error toggling approval:', error);
    throw new Error('Failed to update approval status');
  }

  if (!data) {
    throw new Error('Testimonial not found');
  }

  revalidatePath('/dashboard/settings/testimonials');
  return data;
}
