import { initializeStorage } from '@/lib/supabase/init-storage';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    await initializeStorage();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to initialize:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize' },
      { status: 500 }
    );
  }
}
