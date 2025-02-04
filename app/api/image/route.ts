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
    const fileName = imageUrl.split('/').pop();

    if (!fileName) {
      return new NextResponse('Invalid image filename', { status: 400 });
    }

    const { data: publicUrl } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    if (!publicUrl.publicUrl) {
      return new NextResponse('Invalid image URL', { status: 400 });
    }

    // Fetch the image with proper error handling
    try {
      const response = await fetch(publicUrl.publicUrl, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();

      // Forward the image with enhanced headers
      const headers = new Headers();
      headers.set('Content-Type', response.headers.get('Content-Type') || 'image/jpeg');
      headers.set('Content-Length', buffer.byteLength.toString());
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('Accept-Ranges', 'bytes');

      return new NextResponse(buffer, {
        headers,
        status: 200,
      });
    } catch (fetchError) {
      console.error('Image fetch error:', fetchError);
      return new NextResponse('Failed to fetch image from storage', { status: 502 });
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
