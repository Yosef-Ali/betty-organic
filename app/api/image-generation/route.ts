// pages/api/generate-image.ts
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Readable } from 'stream';

// Type definitions for better error handling
type ErrorResponse = {
  success: false;
  error: string;
  troubleshooting?: string[];
  timestamp: string;
};

type SuccessResponse = {
  success: true;
  imageUrl: string;
  originalImageUrl: string;
  metadata: {
    mimeType: string;
    model: string;
    dimensions: string;
    processedAt: string;
    original: {
      name: string;
      size: number;
      type: string;
    };
    fallback?: boolean;
  };
};

// Create a temporary directory if it doesn't exist
async function ensureTempDir() {
  const tempDir = join(tmpdir(), 'betty-app-images');
  try {
    await mkdir(tempDir, { recursive: true });
    return tempDir;
  } catch (error) {
    console.error('Error creating temp directory:', error);
    return tmpdir();
  }
}

// Helper to create optimized prompts
function createEnhancedPrompt(userPrompt: string, imageName: string): string {
  // Extract hints from filename
  const fileInfo = imageName.toLowerCase();
  const isProduct = fileInfo.includes('product') ||
    fileInfo.includes('item') ||
    fileInfo.includes('goods');

  const productHint = isProduct ?
    "This is a product image that needs enhancement for e-commerce use." :
    "Enhance this image with professional quality.";

  return `
    I need a professional enhanced version of this product image with these specific changes:
    ${userPrompt.trim()}

    ${productHint}

    TECHNICAL REQUIREMENTS (these are mandatory):
    • Generate at EXACTLY 500x500 pixels with square aspect ratio
    • Maintain the primary subject centered in the frame
    • Apply professional product photography standards with clean lighting
    • Ensure high clarity and commercial-grade presentation
    • Preserve the original object but enhance its appearance
    • The subject should remain recognizable but improved
    • Optimize for e-commerce display
  `.trim();
}

export async function POST(req: NextRequest): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Gemini API key",
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Initialize the Gemini model and file manager
    const genAI = new GoogleGenerativeAI(apiKey);
    const fileManager = new GoogleAIFileManager(apiKey);

    // Parse the form data
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File;

    // Validate inputs
    if (!prompt?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide enhancement instructions",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide an image file",
          timestamp: new Date().toISOString()
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please upload a JPEG, PNG, or WebP image",
          timestamp: new Date().toISOString(),
          troubleshooting: ["Try converting your image to one of the supported formats"]
        },
        { status: 400 }
      );
    }

    // Validate file size (max 4MB)
    const maxSize = 4 * 1024 * 1024; // 4MB in bytes
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: "Image size should be less than 4MB",
          timestamp: new Date().toISOString(),
          troubleshooting: ["Resize or compress your image before uploading"]
        },
        { status: 400 }
      );
    }

    // Check for very small images
    const minSize = 10 * 1024; // 10KB in bytes
    if (imageFile.size < minSize) {
      return NextResponse.json({
        success: false,
        error: "The image appears to be too small or low quality for enhancement",
        timestamp: new Date().toISOString(),
        troubleshooting: [
          "Use a larger, higher-resolution image",
          "Ensure the image has adequate lighting",
          "Image should be at least 300x300 pixels"
        ]
      }, { status: 400 });
    }

    // Convert File to ArrayBuffer for upload
    const buffer = await imageFile.arrayBuffer();

    // Save to temp file to process with Gemini
    const tempDir = await ensureTempDir();
    const tempFileName = `${uuidv4()}-${path.basename(imageFile.name)}`;
    const tempFilePath = join(tempDir, tempFileName);

    // Use Uint8Array instead of Buffer for file writing
    await writeFile(tempFilePath, new Uint8Array(buffer));
    console.log(`Saved image to temp file: ${tempFilePath}`);

    // Create an enhanced prompt for better results
    const enhancedPrompt = createEnhancedPrompt(prompt, imageFile.name);

    try {
      // Upload the image to Gemini
      console.log("Uploading image to Gemini...");

      // Upload the image to Gemini using correct parameter structure
      const imageBuffer = Buffer.from(buffer);
      const uploadResult = await fileManager.uploadFile(imageBuffer, {
        mimeType: imageFile.type,
        name: imageFile.name
      });

      if (!uploadResult?.file) {
        throw new Error("File upload failed - no file data received");
      }

      const file = uploadResult.file;
      console.log(`Uploaded file ${file.displayName} as: ${file.name}`);

      // Initialize the model for image generation
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp-image-generation",
      });

      // Configure generation parameters for better success rate
      const generationConfig = {
        temperature: 0.7,
        topP: 0.9,
        topK: 32,
        maxOutputTokens: 8192,
        responseMimeType: "text/plain",
      };

      // Start chat session with history - Next.js 15 pattern with proper async/await
      console.log("Creating chat session with Gemini...");
      const chatSession = await model.startChat({
        generationConfig,
        history: [
          {
            role: "user",
            parts: [
              {
                fileData: {
                  mimeType: file.mimeType,
                  fileUri: file.uri,
                },
              },
              {
                text: enhancedPrompt
              },
            ],
          },
        ],
      });

      // Send message to generate image
      console.log("Sending request to generate image...");
      const result = await chatSession.sendMessage(
        "Please generate the enhanced product image based on my instructions. The output should be exactly 500x500 pixels."
      );

      const response = result.response;
      const parts = response.candidates?.[0]?.content?.parts || [];

      // Find all image parts in response
      const imageParts = parts.filter(
        (part: any): part is { fileData: { mimeType: string; fileUri: string } } =>
          !!part.fileData?.mimeType?.startsWith("image/") && !!part.fileData.fileUri
      );

      if (imageParts.length > 0) {
        const { mimeType, fileUri } = imageParts[0].fileData;

        // Return both the original and generated image URLs with typed response
        return NextResponse.json({
          success: true,
          imageUrl: fileUri,
          originalImageUrl: file.uri,
          metadata: {
            mimeType,
            model: "gemini-2.0-flash-exp-image-generation",
            dimensions: "500x500",
            processedAt: new Date().toISOString(),
            original: {
              name: imageFile.name,
              size: imageFile.size,
              type: imageFile.type
            }
          }
        });
      } else {
        throw new Error("No image was generated in the response");
      }
    } catch (error: any) {
      console.error("API error:", {
        message: error.message,
        cause: error.cause,
        stack: error.stack,
      });

      // Provide more specific error messages based on the error
      let errorMessage = "Image generation failed";
      let statusCode = 500;
      let troubleshootingTips = [
        "Use a clearer image with better lighting",
        "Try a simpler enhancement prompt",
        "Ensure the image has a clear subject",
        "Try using a JPG format image"
      ];

      if (error.message.includes("No response") || error.message.includes("timeout")) {
        errorMessage = "API timed out. Please try again.";
        statusCode = 503;
        troubleshootingTips = ["Try again in a few moments", "Use a smaller image file"];
      } else if (error.message.includes("File upload failed")) {
        errorMessage = "Failed to upload the image. Please try a different image.";
        statusCode = 400;
      } else if (error.message.includes("Invalid image")) {
        errorMessage = "The provided image is invalid or corrupted.";
        statusCode = 400;
      } else if (error.message.includes("quota")) {
        errorMessage = "API quota exceeded. Please try again later.";
        statusCode = 429;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          timestamp: new Date().toISOString(),
          troubleshooting: troubleshootingTips
        },
        { status: statusCode }
      );
    }
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
