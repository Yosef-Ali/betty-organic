import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";

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
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
    });

    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const imageFile = formData.get('image') as File;

    if (!prompt || !imageFile) {
      return NextResponse.json(
        { error: "Both prompt and image are required" },
        { status: 400 }
      );
    }

    // Convert File to Buffer for upload
    const buffer = await imageFile.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    // Upload the image buffer to Gemini
    const uploadResult = await fileManager.uploadFile(imageBuffer, {
      mimeType: imageFile.type,
      displayName: imageFile.name
    });

    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name}`);

    // Configure the generation parameters for optimal image quality
    const generationConfig = {
      temperature: 0.8,  // More controlled output
      topP: 0.8,        // Focus on higher probability tokens
      topK: 32,         // Limit token selection for consistency
      maxOutputTokens: 4096,
      responseMimeType: "image/jpeg",
    };

    // Start chat session with optimized settings
    const chatSession = model.startChat({ generationConfig });

    // Send the enhancement request
    const result = await chatSession.sendMessage([
      {
        text: `Enhance this product image with these specifications:

Input: Original product photo
Requested Changes: ${prompt}

Required Standards:
• Professional studio-quality lighting
• Clean, contextually appropriate background
• Sharp focus on product details
• Commercial-grade color accuracy
• Maintain brand identity elements
• Optimize for e-commerce display

Output Requirements:
• High resolution (minimum 1024x1024)
• Professional product photography style
• Preserve original product authenticity
• Ensure consistent lighting and shadows`
      },
      {
        fileData: {
          mimeType: file.mimeType,
          fileUri: file.uri,
        }
      }
    ]);
    const response = await result.response;

    if (!response.candidates?.[0]?.content?.parts?.[0]?.fileData) {
      throw new Error("No image generated");
    }

    const imageData = response.candidates[0].content.parts[0].fileData;
    return NextResponse.json({
      success: true,
      imageUrl: imageData.fileUri,
    });

  } catch (error: any) {
    console.error("Gemini image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Image generation failed" },
      { status: 500 }
    );
  }
}
