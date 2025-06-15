import { NextRequest, NextResponse } from 'next/server';
import { tempFiles } from '../storage';

export async function GET(
    request: NextRequest,
    { params }: { params: { fileId: string } }
) {
    console.log('🔍 Dynamic route GET called for:', request.url);
    console.log('🔍 Params received:', params);

    try {
        const { fileId } = params;

        if (!fileId) {
            console.log('❌ No fileId in params');
            return NextResponse.json(
                { error: 'File ID is required' },
                { status: 400 }
            );
        }

        console.log('🔍 Looking for file ID:', fileId);
        console.log('🔍 Storage has', tempFiles.size(), 'files');
        console.log('🔍 Available keys:', tempFiles.listKeys());

        const fileInfo = tempFiles.get(fileId);

        if (!fileInfo) {
            console.log('❌ File not found:', fileId);
            return NextResponse.json(
                { error: 'File not found or expired' },
                { status: 404 }
            );
        }

        // Check if expired
        if (Date.now() > fileInfo.expiresAt) {
            console.log('⏰ File expired:', fileId);
            tempFiles.delete(fileId);
            return NextResponse.json(
                { error: 'File expired' },
                { status: 410 }
            );
        }

        console.log('✅ Serving file:', {
            fileId,
            filename: fileInfo.filename,
            contentType: fileInfo.contentType,
            size: fileInfo.data.length
        });

        // Convert base64 back to binary
        const fileBuffer = Buffer.from(fileInfo.data, 'base64');

        // Return file with proper headers for Twilio compatibility
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': fileInfo.contentType,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': 'public, max-age=3600', // Allow caching for 1 hour
                'Access-Control-Allow-Origin': '*', // Allow cross-origin access
                'Access-Control-Allow-Methods': 'GET',
                'Access-Control-Allow-Headers': 'Content-Type',
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
