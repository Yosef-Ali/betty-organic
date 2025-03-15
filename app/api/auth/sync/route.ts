import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const requestBody = await request.json();
  const { event, session } = requestBody;

  try {
    const supabase = await createClient();

    if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
      await supabase.auth.signOut();
      return NextResponse.json({ status: 'signed-out' });
    }

    if (session?.access_token && session?.refresh_token) {
      const { data, error } = await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      if (error) throw error;

      return NextResponse.json({
        status: 'session-updated',
        session: data.session,
        user: data.user,
      });
    }

    return NextResponse.json({ status: 'no-session-update-needed' });
  } catch (error) {
    console.error('Session sync error:', error);
    return NextResponse.json(
      {
        error: 'Session synchronization failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
