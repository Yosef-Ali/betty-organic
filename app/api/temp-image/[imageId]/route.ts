import { NextRequest, NextResponse } from 'next/server';

// Access the same storage used in the parent route
// Using global variable to ensure persistence across requests
declare global {
    var imageStorage: Map<string, {
        data: string;
        filename: string;
        expiresAt: number
    }> | undefined;
}

const getImageStorage = () => {
    if (!globalThis.imageStorage) {
        globalThis.imageStorage = new Map();
    }
    return globalThis.imageStorage;
};

export async function GET(
    request: NextRequest,
    { params }: { params: { imageId: string } }
) {
    try {
        const { imageId } = params;
        const imageStorage = getImageStorage();

        console.log('🖼️ GET request for IMAGE:', {
            imageId,
            storageSize: imageStorage.size,
            availableIds: Array.from(imageStorage.keys())
        });

        if (!imageId) {
            return NextResponse.json(
                { error: 'Image ID is required' },
                { status: 400 }
            );
        }

        const imageInfo = imageStorage.get(imageId);

        if (!imageInfo) {
            console.log('❌ IMAGE not found:', imageId);
            console.log('Available images:', Array.from(imageStorage.keys()));
            return NextResponse.json(
                { error: 'Image not found or expired' },
                { status: 404 }
            );
        }

        // Check if expired
        if (Date.now() > imageInfo.expiresAt) {
            console.log('⏰ IMAGE expired:', imageId);
            imageStorage.delete(imageId);
            return NextResponse.json(
                { error: 'Image expired' },
                { status: 410 }
            );
        }

        console.log('✅ Serving IMAGE:', {
            imageId,
            filename: imageInfo.filename,
            dataSize: imageInfo.data.length
        });

        // Convert base64 back to binary
        const imageBuffer = Buffer.from(imageInfo.data, 'base64');

        // Return image with proper headers for Twilio WhatsApp
        return new NextResponse(imageBuffer, {
            headers: {
                'Content-Type': 'image/png', // Always PNG for invoice images
                'Content-Disposition': `inline; filename="${imageInfo.filename}"`,
                'Cache-Control': 'public, max-age=3600', // Allow caching for Twilio
                'Access-Control-Allow-Origin': '*', // For Twilio access
                'Content-Length': imageBuffer.length.toString(),
            }
        });
    } catch (error) {
        console.error('Error serving temporary image:', error);
        return NextResponse.json(
            { error: 'Failed to serve image' },
            { status: 500 }
        );
    }
}
