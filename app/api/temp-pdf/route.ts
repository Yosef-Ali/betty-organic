import { NextRequest, NextResponse } from 'next/server';

// Global storage that persists across module reloads in development
declare global {
  var tempFileStorage: Map<string, {
    data: string;
    filename: string;
    contentType: string;
    expiresAt: number
  }> | undefined;
}

// Initialize or reuse global storage
const tempStorage = globalThis.tempFileStorage ?? new Map<string, {
  data: string;
  filename: string;
  contentType: string;
  expiresAt: number
}>();

if (process.env.NODE_ENV === 'development') {
  globalThis.tempFileStorage = tempStorage;
}

export async function POST(request: NextRequest) {
  try {
    const { pdfData, filename, expiresIn = 3600, contentType = 'application/pdf' } = await request.json();

    if (!pdfData || !filename) {
      return NextResponse.json(
        { error: 'File data and filename are required' },
        { status: 400 }
      );
    }

    // Generate unique ID for this file
    const fileId = crypto.randomUUID();
    const expiresAt = Date.now() + (expiresIn * 1000);

    // Store file temporarily
    tempStorage.set(fileId, {
      data: pdfData,
      filename,
      contentType,
      expiresAt
    });

    // Return the temporary URL
    const baseUrl = process.env.NEXT_PUBLIC_NGROK_URL ||
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:8080';

    const tempUrl = `${baseUrl}/api/temp-pdf/${fileId}`;

    console.log('📄 Created temporary file URL:', {
      fileId,
      filename,
      contentType,
      tempUrl,
      storageSize: tempStorage.size
    });

    return NextResponse.json({
      url: tempUrl,
      expiresAt: new Date(expiresAt).toISOString(),
      fileId,
      filename,
      contentType
    });
  } catch (error) {
    console.error('Error creating temporary file endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to create temporary file endpoint' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const fileId = pathSegments[pathSegments.length - 1];

    console.log('🔍 GET request debug:', {
      url: request.url,
      pathname: url.pathname,
      pathSegments,
      fileId,
      storageSize: tempStorage.size,
      storageKeys: Array.from(tempStorage.keys())
    });

    if (!fileId || fileId === 'temp-pdf') {
      console.log('❌ Invalid fileId:', fileId);
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }

    const fileInfo = tempStorage.get(fileId);

    if (!fileInfo) {
      console.log('❌ File not found:', fileId);
      console.log('Available files:', Array.from(tempStorage.keys()));
      return NextResponse.json(
        { error: 'File not found or expired' },
        { status: 404 }
      );
    }

    // Check if expired
    if (Date.now() > fileInfo.expiresAt) {
      console.log('⏰ File expired:', fileId);
      tempStorage.delete(fileId);
      return NextResponse.json(
        { error: 'File expired' },
        { status: 410 }
      );
    }

    console.log('✅ Serving file:', {
      fileId,
      filename: fileInfo.filename,
      contentType: fileInfo.contentType
    });

    // Convert base64 back to binary
    const fileBuffer = Buffer.from(fileInfo.data, 'base64');

    // Return file with proper headers for Twilio compatibility
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': fileInfo.contentType,
        'Content-Disposition': `inline; filename="${fileInfo.filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*', // For Twilio access
      }
    });
  } catch (error) {
    console.error('Error serving temporary file:', error);
    return NextResponse.json(
      { error: 'Failed to serve file' },
      { status: 500 }
    );
  }
}
