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
    console.log("Uploading image to Gemini...");
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

    // Improved prompt formatting to enhance generation success
    const enhancedPrompt = `
      Generate a professional product photo based on this image with the following enhancements:
      ${prompt.trim()}

      Technical requirements:
      • Output must be exactly 500x500 pixels with 1:1 square aspect ratio
      • High resolution and clear details
      • Professional product photography lighting and shadows
      • Commercial product presentation quality
      • Keep the product as the main subject
      • The product should be clearly visible and enhanced
    `.trim();

    // Configure generation parameters based on the new Gemini 2.0 requirements
    const generationConfig = {
      temperature: 0.9, // Slightly reduce temperature for more predictable results
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    // Start chat session with history and retry logic for image generation
    console.log("Starting image generation chat session...");
    const chatSession = await retryOperation(
      async () => model.startChat({
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
      }),
      {
        retries: 2,
        onRetry: (error: Error) => {
          console.warn('Retrying chat session creation:', error.message);
        }
      }
    );

    // Send a simple message to continue the chat and generate the image with retry logic
    console.log("Sending generation request to Gemini...");
    const result = await retryOperation(
      async () => chatSession.sendMessage("Please generate the enhanced product image at exactly 500x500 pixels following the instructions I provided."),
      {
        retries: 2,
        onRetry: (error: Error) => {
          console.warn('Retrying image generation:', error.message);
        }
      }
    );

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
      console.error("No image parts found in Gemini response");

      // Try to get the text response for better error reporting
      const textParts = parts.filter(part => typeof part.text === 'string');
      const errorMessage = textParts.length > 0
        ? `Model couldn't generate an image: ${textParts[0].text?.substring(0, 100)}`
        : "The model couldn't generate a valid image. Try a different image or a simpler prompt.";

      return NextResponse.json({
        success: false,
        error: errorMessage,
        troubleshooting: [
          "Use a clearer image with better lighting",
          "Try a simpler enhancement prompt",
          "Ensure the image has a clear subject",
          "Avoid dark or blurry images",
          "Try a different image format (JPG or PNG)"
        ]
      }, { status: 422 });
    }

    const [generatedImage] = imageParts;
    const { mimeType, fileUri } = generatedImage.fileData;

    // Return both the original and generated image URLs for side-by-side display
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
  } catch (error: any) {
    console.error("Gemini API error:", {
      message: error.message,
      cause: error.cause,
      stack: error.stack,
    });

    // Provide more specific error messages based on the error
    let errorMessage = "Image generation failed";
    let statusCode = 500;
    let troubleshootingTips = [];

    if (error.message.includes("No response")) {
      errorMessage = "Gemini API timed out. Please try again.";
      statusCode = 503;
      troubleshootingTips = ["Try again in a few moments", "Use a smaller image file"];
    } else if (error.message.includes("File upload failed")) {
      errorMessage = "Failed to upload the image. Please try a different image.";
      statusCode = 400;
      troubleshootingTips = ["Use a different image format", "Reduce image file size"];
    } else if (error.message.includes("Invalid image")) {
      errorMessage = "The provided image is invalid or corrupted.";
      statusCode = 400;
      troubleshootingTips = ["Try a different image file", "Convert image to JPG format"];
    } else if (error.message.includes("quota")) {
      errorMessage = "API quota exceeded. Please try again later.";
      statusCode = 429;
      troubleshootingTips = ["Try again after some time", "Contact system administrator"];
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
}
