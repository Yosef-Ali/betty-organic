import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// The place ID from the URL: https://g.co/kgs/xgngmbF
const PLACE_ID = 'ChIJmWVjEEYEWTkROEKJ7ha6HVE';
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function GET() {
  try {
    // First check cache
    const { data: cachedReviews } = await supabase
      .from('google_reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (cachedReviews && cachedReviews.length > 0) {
      const cacheAge = Date.now() - new Date(cachedReviews[0].created_at).getTime();
      // If cache is less than 24 hours old, return it
      if (cacheAge < 24 * 60 * 60 * 1000) {
        return NextResponse.json({ reviews: cachedReviews });
      }
    }

    // If no API key, return cached data or empty array
    if (!GOOGLE_API_KEY) {
      console.warn('No Google API key found');
      return NextResponse.json({ reviews: cachedReviews || [] });
    }

    // Fetch fresh reviews from Google
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${PLACE_ID}&fields=reviews&key=${GOOGLE_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Google reviews');
    }

    const data = await response.json();
    const reviews = data.result.reviews || [];

    // Transform reviews to match our schema
    const transformedReviews = reviews.map((review: any) => ({
      author_name: review.author_name,
      rating: review.rating,
      content: review.text,
      created_at: new Date(review.time * 1000).toISOString(),
      source: 'google',
      approved: true,
      profile_photo_url: review.profile_photo_url
    }));

    // Update cache in Supabase
    if (transformedReviews.length > 0) {
      await supabase
        .from('google_reviews')
        .upsert(transformedReviews, {
          onConflict: 'author_name',
        });
    }

    return NextResponse.json({ reviews: transformedReviews });
  } catch (error) {
    console.error('Error fetching Google reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
