'use server';

import { GeminiService } from '../services/geminiService';
import { GeminiConfig } from '../types/gemini';

export async function generateImage(
  prompt: string,
  referenceImages: { data: string; mimeType: string }[] = [],
  config?: Partial<GeminiConfig>
) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      error: 'GEMINI_API_KEY environment variable is not configured'
    };
  }

  if (!prompt) {
    return {
      success: false,
      error: 'Prompt is required'
    };
  }

  try {
    const geminiService = new GeminiService();
    const result = await geminiService.generateImage(prompt, referenceImages, config);

    if (!result) {
      return {
        success: false,
        error: 'No response generated from Gemini'
      };
    }

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('Error in generateImage action:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return {
          success: false,
          error: 'Invalid or missing Gemini API key'
        };
      }
      if (error.message.includes('initialized')) {
        return {
          success: false,
          error: 'Failed to initialize Gemini service'
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate image'
    };
  }
}
