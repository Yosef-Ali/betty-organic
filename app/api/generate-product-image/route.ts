import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

interface RetryOptions {
  retries: number;
  onRetry: (error: Error) => void;
}

// Utility function for retrying failed operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error;
  for (let i = 0; i <= options.retries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < options.retries) {
        options.onRetry(lastError);
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  throw lastError!;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const fileManager = new GoogleAIFileManager(apiKey);

    // Use the new model name for image generation
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
    });

    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File;

    // Validate inputs
    if (!prompt?.trim()) {
      return NextResponse.json(
        { error: "Please provide enhancement instructions" },
        { status: 400 }
      );
    }

    if (!imageFile) {
      return NextResponse.json(
        { error: "Please provide an image file" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { error: "Please upload a JPEG, PNG, or WebP image" },
        { status: 400 }
      );
    }

    // Validate file size (max 4MB)
    const maxSize = 4 * 1024 * 1024; // 4MB in bytes
    if (imageFile.size > maxSize) {
      return NextResponse.json(
        { error: "Image size should be less than 4MB" },
        { status: 400 }
      );
    }

    // Convert File to Buffer for upload
    const buffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    // Upload the image buffer to Gemini with retry logic
    const uploadResult = await retryOperation(
      async () => await fileManager.uploadFile(imageBuffer, {
        mimeType: imageFile.type,
        displayName: imageFile.name
      }),
      {
        retries: 3,
        onRetry: (error: Error) => {
          console.warn('Retrying file upload:', error.message);
        }
      }
    );

    if (!uploadResult?.file) {
      throw new Error("File upload failed - no file data received");
    }

    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);

    // Configure generation parameters based on the new Gemini 2.0 requirements
    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    // Start chat session with history - this is the new approach for image generation
    const chatSession = model.startChat({
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
              text: `Apply these enhancements: ${prompt}
              Required standards:
              • Professional product photography
              • Clean, contextually relevant background
              • Optimal lighting and shadows
              • Commercial-quality presentation
              • High resolution and clarity`
            },
          ],
        },
      ],
    });

    // Send a simple message to continue the chat and generate the image
    const result = await chatSession.sendMessage("Please generate the enhanced product image based on my instructions");

    console.log("Gemini response received");

    // Extract the image from the response
    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts || [];

    // Find all image parts in the response
    const imageParts = parts.filter(
      (part): part is { fileData: { mimeType: string; fileUri: string } } =>
        !!part.fileData?.mimeType?.startsWith("image/") && !!part.fileData.fileUri
    );

    if (!imageParts.length) {
      throw new Error("No valid image was generated");
    }

    const [generatedImage] = imageParts;
    const { mimeType, fileUri } = generatedImage.fileData;

    // Return success response with the image URL
    return NextResponse.json({
      success: true,
      imageUrl: fileUri,
      metadata: {
        mimeType,
        model: "gemini-2.0-flash-exp-image-generation",
        processedAt: new Date().toISOString(),
        original: {
          name: imageFile.name,
          size: imageFile.size,
          type: imageFile.type
        }
      }
    });
  } catch (error: any) {
    console.error("Gemini API error:", {
      message: error.message,
      cause: error.cause,
      stack: error.stack,
    });

    const errorMessage = error.message || "Image generation failed";
    const statusCode = error.message.includes("No response") ? 503 : 500;

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}
