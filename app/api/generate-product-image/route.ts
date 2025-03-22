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

// Format the image prompt to maximize chances of success
function createOptimizedPrompt(userPrompt: string, imageName: string): string {
  // Extract any useful information from the filename
  const fileInfo = imageName.toLowerCase();
  const isProduct = fileInfo.includes('product') ||
    fileInfo.includes('item') ||
    fileInfo.includes('goods');

  const productHints = isProduct ?
    "This is a product image that needs enhancement for e-commerce use." :
    "Enhance this image with professional quality.";

  // Create a structured prompt that works well with Gemini
  return `
    I need a professional enhanced version of this product image with these specific changes:
    ${userPrompt.trim()}

    ${productHints}

    TECHNICAL REQUIREMENTS (these are mandatory):
    • Generate at EXACTLY 500x500 pixels with square aspect ratio
    • Maintain the primary subject centered in the frame
    • Apply professional product photography standards with clean lighting
    • Ensure high clarity and commercial-grade presentation
    • Preserve the original object but enhance its appearance
    • The subject should remain recognizable but improved
    • Optimize for e-commerce display
    • Make sure the entire item is visible and properly lit
  `.trim();
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

    // Check for very dark or very small images
    // We can't directly analyze the image here, but we can check file size as a rough proxy
    const minSize = 10 * 1024; // 10KB in bytes
    if (imageFile.size < minSize) {
      return NextResponse.json({
        success: false,
        error: "The image appears to be too small or low quality for enhancement",
        troubleshooting: [
          "Use a larger, higher-resolution image",
          "Ensure the image has adequate lighting",
          "Image should be at least 300x300 pixels"
        ]
      }, { status: 400 });
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

    // Create optimized prompt for better results
    const enhancedPrompt = createOptimizedPrompt(prompt, imageFile.name);

    // Configure generation parameters for better success rate
    // Lower temperature for more deterministic results
    const generationConfig = {
      temperature: 0.7,
      topP: 0.9,
      topK: 32,
      maxOutputTokens: 8192,
      responseMimeType: "text/plain",
    };

    console.log("Starting image generation with optimized prompt...");

    // Make three generation attempts with different parameters
    // Each attempt uses slightly different approach for maximum chance of success
    async function attemptGeneration(attempt = 1): Promise<any> {
      try {
        console.log(`Generation attempt ${attempt}...`);

        // Adjust parameters based on attempt number
        const attemptConfig = {
          ...generationConfig,
          temperature: attempt === 1 ? 0.7 : attempt === 2 ? 0.85 : 0.6,
        };

        // Slight variations in prompt based on attempt
        let attemptPrompt = enhancedPrompt;
        if (attempt === 2) {
          attemptPrompt += "\n\nPlease ensure the image is exactly 500x500 pixels. Focus on clarity and professional presentation.";
        } else if (attempt === 3) {
          attemptPrompt += "\n\nGenerate a simple, clean product image with neutral background at 500x500 pixels.";
        }

        // Start chat session with history
        const chatSession = await model.startChat({
          generationConfig: attemptConfig,
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
                  text: attemptPrompt
                },
              ],
            },
          ],
        });

        // Send message to generate image
        const result = await chatSession.sendMessage(
          "Please generate the enhanced product image based on my instructions. The output should be exactly 500x500 pixels."
        );

        const response = result.response;
        const parts = response.candidates?.[0]?.content?.parts || [];

        // Find all image parts in response
        const imageParts = parts.filter(
          (part): part is { fileData: { mimeType: string; fileUri: string } } =>
            !!part.fileData?.mimeType?.startsWith("image/") && !!part.fileData.fileUri
        );

        if (imageParts.length > 0) {
          return imageParts[0];
        } else {
          throw new Error("No image generated");
        }
      } catch (error) {
        console.warn(`Attempt ${attempt} failed:`, error);
        if (attempt < 3) {
          console.log(`Trying alternative approach (attempt ${attempt + 1})...`);
          return await attemptGeneration(attempt + 1);
        }
        throw error;
      }
    }

    // Try multiple generation attempts
    try {
      const generatedImage = await attemptGeneration();
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
    } catch (error) {
      // No attempts succeeded, provide guidance based on likely issues
      console.error("All generation attempts failed:", error);

      return NextResponse.json({
        success: false,
        error: "The model couldn't generate an image with your current inputs",
        troubleshooting: [
          "Use an image with clearer lighting and less complexity",
          "Try a simpler enhancement request (e.g., 'Make this product look professional')",
          "Ensure the product is clearly visible in the image",
          "Use a higher quality source image if possible",
          "Try a different image format (JPG works best)"
        ],
        technicalDetails: error instanceof Error ? error.message : String(error)
      }, { status: 422 });
    }
  } catch (error: any) {
    console.error("Gemini API error:", {
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
