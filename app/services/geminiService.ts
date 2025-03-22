import {
  GoogleGenerativeAI,
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
  private readonly model: any;
  private readonly defaultConfig: GeminiConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  };

  constructor(config?: GeminiServiceConfig) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }

    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.fileManager = new GoogleAIFileManager(this.apiKey);

    this.model = this.genAI.getGenerativeModel({
      model: config?.modelName || "gemini-2.0-flash-exp-image-generation",
    });
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
    try {
      const generationConfig: GeminiConfig = {
        ...this.defaultConfig,
        ...config,
      };

      // Create chat session with reference images
      const chatSession = this.model.startChat({
        generationConfig,
        history: referenceImages.map(image => ({
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: image.mimeType,
                data: image.data,
              },
            },
          ],
        })),
      });

      // Send the generation prompt
      const result = await chatSession.sendMessage(prompt);
      return result.response;
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
