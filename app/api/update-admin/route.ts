import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    console.log('Updating role for user:', session.user.id);

    // Update profile role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', session.user.id);

    if (profileError) {
      console.error('Profile update error:', profileError);
      throw profileError;
    }

    // Update user metadata
    const { error: userError } = await supabase.auth.updateUser({
      data: { role: 'admin' }
    });

    if (userError) {
      console.error('User metadata update error:', userError);
      throw userError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
  }
}
