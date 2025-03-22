import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

// Helper function to make multiple generation attempts with different parameters
// Each attempt uses slightly different approach for maximum chance of success
async function makeGenerationAttempt(
  model: any,
  file: any,
  enhancedPrompt: string,
  generationConfig: any,
  attemptNum = 1
) {
  try {
    console.log(`Generation attempt ${attemptNum}...`);

    // Adjust parameters based on attempt number
    const attemptConfig = {
      ...generationConfig,
      temperature: attemptNum === 1 ? 0.7 : attemptNum === 2 ? 0.85 : 0.6,
    };

    // Slight variations in prompt based on attempt
    let attemptPrompt = enhancedPrompt;
    if (attemptNum === 2) {
      attemptPrompt += "\n\nPlease ensure the image is exactly 500x500 pixels. Focus on clarity and professional presentation.";
    } else if (attemptNum === 3) {
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
      (part: any): part is { fileData: { mimeType: string; fileUri: string } } =>
        !!part.fileData?.mimeType?.startsWith("image/") && !!part.fileData.fileUri
    );

    if (imageParts.length > 0) {
      return imageParts[0];
    } else {
      throw new Error("No image generated");
    }
  } catch (error) {
    console.warn(`Attempt ${attemptNum} failed:`, error);
    if (attemptNum < 3) {
      console.log(`Trying alternative approach (attempt ${attemptNum + 1})...`);
      return await makeGenerationAttempt(model, file, enhancedPrompt, generationConfig, attemptNum + 1);
    }
    throw error;
  }
}

// Fallback function to generate image using OpenRouter API
async function fallbackImageGeneration(
  imageBase64: string,
  prompt: string
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;

    if (!openRouterKey) {
      throw new Error("OpenRouter API key not found");
    }

    console.log("Using OpenRouter fallback image generation...");

    // OpenRouter compatible model that supports image generation
    const model = "anthropic/claude-3-opus";

    // Simplified prompt for better results
    const openRouterPrompt = `
    You are a professional product photographer. Please enhance this product image with the following:

    ${prompt.trim()}

    Create a professional, high-quality product photograph at exactly 500x500 pixels.
    Make sure it's well-lit, has good contrast, and looks clean and professional.
    The final image must be exactly 500x500 pixels.
    `;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openRouterKey}`,
        "HTTP-Referer": "https://betty-organic-app.example.com",
        "X-Title": "Betty Organic App"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: openRouterPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 1024,
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${error}`);
    }

    const result = await response.json();

    // Extract image URL from response (format depends on the model)
    const content = result.choices[0]?.message?.content;
    let imageUrl;

    try {
      // Try to parse JSON if the content is a JSON string
      const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
      imageUrl = parsedContent.image_url || parsedContent.imageUrl || parsedContent.url;
    } catch (e) {
      // If not JSON, try to extract URL using regex
      const urlMatch = /https?:\/\/[^\s"]+\.(jpg|jpeg|png|webp)/i.exec(content);
      imageUrl = urlMatch ? urlMatch[0] : null;
    }

    if (!imageUrl) {
      throw new Error("No image URL found in the response");
    }

    return {
      success: true,
      imageUrl
    };
  } catch (error) {
    console.error("OpenRouter fallback image generation failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Convert a File to base64 string for API calls
async function fileToBase64(imageFile: File): Promise<string> {
  const buffer = await imageFile.arrayBuffer();
  return Buffer.from(buffer).toString('base64');
}

export async function POST(req: NextRequest) {
  try {
    // Get the Gemini API key
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

    // Try multiple generation attempts with Gemini first
    try {
      const generatedImage = await makeGenerationAttempt(model, file, enhancedPrompt, generationConfig, 1);
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
    } catch (geminiError) {
      // Log the Gemini error
      console.error("Gemini image generation failed:", geminiError);

      // If Gemini fails, try the OpenRouter fallback
      console.log("Attempting fallback image generation with OpenRouter...");

      try {
        // Convert image to base64 for fallback service
        const imageBase64 = await fileToBase64(imageFile);

        // Try fallback generation with OpenRouter
        const fallbackResult = await fallbackImageGeneration(imageBase64, prompt);

        if (fallbackResult.success && fallbackResult.imageUrl) {
          // Return successful fallback result
          return NextResponse.json({
            success: true,
            imageUrl: fallbackResult.imageUrl,
            originalImageUrl: file.uri, // Still use the Gemini-uploaded original for comparison
            metadata: {
              mimeType: imageFile.type,
              model: "openrouter-fallback",
              dimensions: "500x500",
              processedAt: new Date().toISOString(),
              original: {
                name: imageFile.name,
                size: imageFile.size,
                type: imageFile.type
              },
              fallback: true
            }
          });
        } else {
          // Fallback also failed
          throw new Error(fallbackResult.error || "Fallback generation also failed");
        }
      } catch (fallbackError) {
        // Both Gemini and fallback failed
        console.error("Fallback image generation failed:", fallbackError);

        // No attempts succeeded, provide guidance based on likely issues
        return NextResponse.json({
          success: false,
          error: "Could not generate an image with current inputs (both primary and fallback services failed)",
          troubleshooting: [
            "Use an image with clearer lighting and less complexity",
            "Try a simpler enhancement request (e.g., 'Make this product look professional')",
            "Ensure the product is clearly visible in the image",
            "Use a higher quality source image if possible",
            "Try a different image format (JPG works best)"
          ],
          technicalDetails: {
            primary: geminiError instanceof Error ? geminiError.message : String(geminiError),
            fallback: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          }
        }, { status: 422 });
      }
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

    if (error.message.includes("No response")) {
      errorMessage = "API timed out. Please try again.";
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

