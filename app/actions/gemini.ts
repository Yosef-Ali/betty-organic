'use server';

import { GeminiService } from '../services/geminiService';
import { GeminiConfig } from '../types/gemini';

export async function generateImage(
  prompt: string,
  referenceImages: { data: string; mimeType: string }[] = [],
  config?: Partial<GeminiConfig>
) {
  try {
    const geminiService = new GeminiService();
    const result = await geminiService.generateImage(prompt, referenceImages, config);
    return { success: true, data: result };
  } catch (error) {
    console.error('Error in generateImage action:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image'
    };
  }
}
