import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Use getUser instead of getSession for better security
    // getUser verifies with the Supabase Auth server
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('User authentication error:', userError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ status: 'not_authenticated' }, { status: 200 });
    }

    // Get session for additional data if needed
    const { data: { session } } = await supabase.auth.getSession();

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile error:', profileError);
      return NextResponse.json({ error: 'Profile error' }, { status: 500 });
    }

    // Return user data
    return NextResponse.json({
      status: 'ok',
      initialized: true,
      session,
      profile
    }, { status: 200 });

  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json({ error: 'Failed to initialize' }, { status: 500 });
  }
}
