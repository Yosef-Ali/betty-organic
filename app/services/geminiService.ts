import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { promises as fs } from 'fs';
import path from 'path';
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
  private readonly model: any; // Replace 'any' with proper type when available
  private readonly defaultConfig: GeminiConfig = {
    temperature: 0.7,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
  };

  constructor(config?: GeminiServiceConfig) {
    // Use server-side environment variable
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
   * Uploads a file to Gemini with proper error handling
   * @param filePath - Path to the file
   * @param mimeType - MIME type of the file
   * @returns Promise<GeminiFile> - Uploaded file object
   */
  async uploadToGemini(filePath: string, mimeType: string): Promise<GeminiFile> {
    try {
      // Check if file exists
      await fs.access(filePath);

      const uploadResult = await this.fileManager.uploadFile(filePath, {
        mimeType,
        displayName: path.basename(filePath),
      });

      console.log(`Successfully uploaded: ${uploadResult.file.displayName}`);
      return {
        ...uploadResult.file,
        fileUri: uploadResult.file.name,
        displayName: uploadResult.file.displayName || path.basename(filePath),
      };
    } catch (error) {
      console.error(`Error uploading file ${filePath}:`, error);
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates an image based on the input prompt and reference images
   * @param prompt - The text prompt for image generation
   * @param referenceImages - Array of paths to reference images
   * @param config - Optional generation configuration
   * @returns Promise<GeminiResponse> - Generated image result
   */
  async generateImage(
    prompt: string,
    referenceImages: string[] = [],
    config?: Partial<GeminiConfig>
  ): Promise<GeminiResponse> {
    try {
      const generationConfig: GeminiConfig = {
        ...this.defaultConfig,
        ...config,
      };

      // Upload reference images if provided
      const uploadedFiles = await Promise.all(
        referenceImages.map(async (imagePath) => {
          const mimeType = this.getMimeType(imagePath);
          return this.uploadToGemini(imagePath, mimeType);
        })
      );

      // Create chat session with reference images
      const chatSession = this.model.startChat({
        generationConfig,
        history: uploadedFiles.map(file => ({
          role: "user",
          parts: [
            {
              fileData: {
                mimeType: file.mimeType,
                fileUri: file.fileUri,
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

  /**
   * Determines the MIME type based on file extension
   * @param filePath - Path to the file
   * @returns string - MIME type
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'image/jpeg';
  }
}
