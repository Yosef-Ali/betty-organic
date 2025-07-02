import { NextRequest, NextResponse } from 'next/server';

// Global storage for images that persists across requests
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

// Clean up expired images to save memory
const cleanupExpiredImages = () => {
    const imageStorage = getImageStorage();
    const now = Date.now();
    let removedCount = 0;

    // Use Array.from to handle iteration properly
    const entries = Array.from(imageStorage.entries());
    for (const [id, data] of entries) {
        if (data.expiresAt < now) {
            imageStorage.delete(id);
            removedCount++;
        }
    }

    if (removedCount > 0) {
        console.log(`🧹 Cleaned up ${removedCount} expired images. Storage size: ${imageStorage.size}`);
    }

    return removedCount;
};

export async function POST(request: NextRequest) {
    try {
        const { imageData, filename, expiresIn = 600 } = await request.json(); // Default to 10 minutes

        if (!imageData || !filename) {
            return NextResponse.json(
                { error: 'Image data and filename are required' },
                { status: 400 }
            );
        }

        // Clean up expired images first to save memory
        cleanupExpiredImages();

        // Generate unique ID for this image
        const imageId = crypto.randomUUID();
        const expiresAt = Date.now() + (expiresIn * 1000);

        const imageStorage = getImageStorage();

        // Store image temporarily (images only!)
        imageStorage.set(imageId, {
            data: imageData,
            filename,
            expiresAt
        });

        // Return the temporary URL
        const baseUrl = process.env.NEXT_PUBLIC_NGROK_URL ||
            process.env.NEXTAUTH_URL ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            'http://localhost:3000';

        const imageUrl = `${baseUrl}/api/temp-image/${imageId}`;

        console.log('🖼️ Created temporary IMAGE URL:', {
            imageId,
            filename,
            imageUrl,
            storageSize: imageStorage.size
        });

        return NextResponse.json({
            url: imageUrl,
            expiresAt: new Date(expiresAt).toISOString(),
            imageId,
            filename
        });
    } catch (error) {
        console.error('Error creating temporary image endpoint:', error);
        return NextResponse.json(
            { error: 'Failed to create temporary image endpoint' },
            { status: 500 }
        );
    }
}
