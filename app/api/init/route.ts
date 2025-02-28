import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // This is a simple initialization endpoint that returns a success status
    // You can add any app initialization logic here if needed

    return NextResponse.json({ status: 'ok', initialized: true }, { status: 200 });
  } catch (error) {
    console.error('Initialization error:', error);
    return NextResponse.json({ error: 'Failed to initialize' }, { status: 500 });
  }
}
