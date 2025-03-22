import { NextResponse } from 'next/server';
import { GeminiService } from '../../services/geminiService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, referenceImages, config } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const geminiService = new GeminiService();
    const result = await geminiService.generateImage(
      prompt,
      referenceImages || [],
      config
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error in generate-image route:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}
