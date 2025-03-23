import {
  GoogleGenerativeAI,
  GenerativeModel,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import {
  GeminiConfig,
  GeminiFile,
  GeminiResponse,
  GeminiChatSession,
  GeminiServiceConfig,
} from '../types/gemini';

export class GeminiService {
  private readonly apiKey: string;
  private readonly genAI: GoogleGenerativeAI;
  private readonly fileManager: GoogleAIFileManager;
  private model: GenerativeModel;
  private initialized: boolean = false;

  constructor(config?: GeminiServiceConfig) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.apiKey = process.env.GEMINI_API_KEY;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.fileManager = new GoogleAIFileManager(this.apiKey);

    try {
      this.model = this.genAI.getGenerativeModel({
        model: config?.modelName || "gemini-pro-vision",
      });
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize Gemini service:', error);
      throw new Error('Failed to initialize Gemini service');
    }
  }

  private ensureInitialized() {
    if (!this.initialized) {
      throw new Error('Gemini service not initialized');
    }
  }

  /**
   * Generates an image based on the input prompt and reference images
   * @param prompt - The text prompt for image generation
   * @param referenceImages - Array of base64 encoded images
   * @param config - Optional generation configuration
   * @returns Promise<GeminiResponse> - Generated image result
   */
  async generateImage(
    prompt: string,
    referenceImages: { data: string; mimeType: string }[] = [],
    config?: Partial<GeminiConfig>
  ): Promise<GeminiResponse> {
    this.ensureInitialized();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    try {
      const safetySettings = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ];

      const generationConfig = {
        temperature: config?.temperature ?? 0.7,
        topP: config?.topP ?? 0.95,
        topK: config?.topK ?? 40,
        maxOutputTokens: config?.maxOutputTokens ?? 8192,
      };

      const parts = [
        { text: prompt },
        ...referenceImages.map(img => ({
          inlineData: {
            mimeType: img.mimeType,
            data: img.data
          }
        }))
      ];

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts }],
        generationConfig,
        safetySettings,
      });

      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response generated from Gemini');
      }

      return response;
    } catch (error) {
      console.error('Error in generateImage:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to generate image');
    }
  }
}
