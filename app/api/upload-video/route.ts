import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// Increase max body size for this route specifically
export const config = {
  runtime: 'edge',
  maxDuration: 60, // Extend the function's runtime duration for large uploads
};

// Maximum video size: 50MB
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    // Check authentication
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user profile to verify admin access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can upload videos' },
        { status: 403 }
      );
    }

    // Get form data with file
    const formData = await request.formData();
    const file = formData.get('video') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file is actually video
    if (!file.type.startsWith('video/')) {
      return NextResponse.json(
        { error: 'Not a valid video format' },
        { status: 400 }
      );
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      );
    }

    // Convert to array buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Generate unique name with UUID and timestamp
    const timestamp = Date.now();
    const fileExt = file.type.split('/')[1] || 'mp4';
    const uuid = uuidv4();
    const fileName = `${uuid}-${timestamp}.${fileExt}`;
    const filePath = `about/videos/${fileName}`;

    // Create bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const aboutVideosBucket = buckets?.find(b => b.name === 'about_videos');

    if (!aboutVideosBucket) {
      await supabase.storage.createBucket('about_videos', {
        public: true,
        fileSizeLimit: 52428800, // 50MB in bytes
      });
    }

    // Upload to Supabase
    const { error: uploadError } = await supabase.storage
      .from('about_videos')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL for the uploaded video
    const { data: urlData } = supabase.storage
      .from('about_videos')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to generate public URL' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      videoUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Error handling video upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
