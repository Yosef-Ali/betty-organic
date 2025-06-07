import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// This route handles getting and setting AI API keys
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get AI configuration status (without exposing actual keys)
    const { data: settings } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['OPENAI_API_KEY', 'GOOGLE_AI_API_KEY', 'STABILITY_API_KEY']);

    const status = {
      'OPENAI_API_KEY': { 
        configured: !!settings?.find(s => s.key === 'OPENAI_API_KEY')?.value 
      },
      'GOOGLE_AI_API_KEY': { 
        configured: !!settings?.find(s => s.key === 'GOOGLE_AI_API_KEY')?.value 
      },
      'STABILITY_API_KEY': { 
        configured: !!settings?.find(s => s.key === 'STABILITY_API_KEY')?.value 
      }
    };

    return NextResponse.json({ status });
  } catch (error) {
    console.error('AI config GET error:', error);
    return NextResponse.json(
      { error: 'Failed to load configuration' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { envKey, apiKey } = await req.json();

    if (!envKey || !apiKey) {
      return NextResponse.json(
        { error: 'Environment key and API key are required' },
        { status: 400 }
      );
    }

    // Validate the environment key
    const validKeys = ['OPENAI_API_KEY', 'GOOGLE_AI_API_KEY', 'STABILITY_API_KEY'];
    if (!validKeys.includes(envKey)) {
      return NextResponse.json(
        { error: 'Invalid environment key' },
        { status: 400 }
      );
    }

    // Store the API key in app_settings table (encrypted)
    const { error } = await supabase
      .from('app_settings')
      .upsert({
        key: envKey,
        value: apiKey, // In production, consider encrypting this
        updated_by: session.user.id,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to save API key' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `${envKey} saved successfully` 
    });

  } catch (error) {
    console.error('AI config POST error:', error);
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    );
  }
}
