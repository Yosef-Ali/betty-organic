import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { auth } from '@clerk/nextjs';

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();

    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { base64Image, mimeType, prompt } = await request.json();

    if (!base64Image || !mimeType) {
      return NextResponse.json(
        { success: false, error: 'Image data and mime type are required' },
        { status: 400 }
      );
    }

    // Prepare the model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

    // Prepare the image part
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };

    // Create prompt text based on user input or use default
    const promptText = prompt
      ? `Enhance this product image: ${prompt}. Make it look professional and appealing for an e-commerce site.`
      : 'Enhance this product image to make it look professional and appealing for an e-commerce site. Improve lighting, colors, and clarity.';

    // Generate content
    const result = await model.generateContent([promptText, imagePart]);
    const response = await result.response;
    const text = response.text();

    // If no image was generated in the response
    if (!text.includes('data:image')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Could not generate image. The AI returned text only.'
        },
        { status: 422 }
      );
    }

    // Extract base64 image data from response
    const matches = text.match(/data:image\/[^;]+;base64,([^"]+)/);
    if (!matches || matches.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Unable to extract image data from AI response' },
        { status: 422 }
      );
    }

    const extractedImage = matches[1];

    return NextResponse.json({
      success: true,
      image: extractedImage,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate image'
      },
      { status: 500 }
    );
  }
}
