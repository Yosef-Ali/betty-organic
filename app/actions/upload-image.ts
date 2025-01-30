'use server';

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from './auth';
import { redirect } from 'next/navigation';

export async function uploadImage(formData: FormData) {
  const currentUser = await getCurrentUser();
  const user = currentUser?.user;

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  try {
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file);

    if (error) throw error;

    return fileName;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export async function uploadTestimonialImage(formData: FormData) {
  const currentUser = await getCurrentUser();
  const user = currentUser?.user;
  const isAdmin = currentUser?.isAdmin;

  if (!user || !isAdmin) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  try {
    const file = formData.get('file') as File;
    const testimonialId = formData.get('testimonialId') as string;

    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `testimonials/${testimonialId}/${uuidv4()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('images')
      .upload(fileName, file);

    if (error) throw error;

    return fileName;
  } catch (error) {
    console.error('Error uploading testimonial image:', error);
    throw error;
  }
}
