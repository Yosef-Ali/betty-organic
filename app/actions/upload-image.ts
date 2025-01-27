'use server';

import { createClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from './auth';
import { redirect } from 'next/navigation';

export async function uploadTestimonialImage(formData: FormData) {
  const { user, isAdmin } = await getCurrentUser();

  if (!user || !isAdmin) {
    redirect('/dashboard');
  }

  const supabase = await createClient();

  try {
    // Get the file from formData
    const file = formData.get('file') as File;
    const testimonialId = formData.get('testimonialId') as string;

    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = testimonialId
      ? `testimonials/${testimonialId}/${fileName}`
      : `testimonials/temp/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public')
      .upload(filePath, buffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error('Failed to upload image');
    }

    // Get public URL
    const { data: publicUrl } = supabase.storage
      .from('public')
      .getPublicUrl(filePath);

    return {
      success: true,
      imageUrl: publicUrl.publicUrl,
    };
  } catch (error) {
    console.error('Error handling image upload:', error);
    throw error;
  }
}
