import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');
    const width = searchParams.get('w');
    const quality = searchParams.get('q');

    if (!imageUrl) {
      return new NextResponse('Missing image URL', { status: 400 });
    }

    // Verify the URL is from our Supabase storage
    const supabase = await createClient();
    const { data: publicUrl } = supabase.storage
      .from('product-images')
      .getPublicUrl(imageUrl.split('/').pop() || '');

    if (!publicUrl.publicUrl) {
      return new NextResponse('Invalid image URL', { status: 400 });
    }

    // Fetch the image
    const response = await fetch(publicUrl.publicUrl);
    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: response.status });
    }

    // Forward the image with original headers
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(response.body, {
      headers,
      status: 200,
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
