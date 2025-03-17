import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ error: 'Session error' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ status: 'no_session' }, { status: 200 });
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
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
