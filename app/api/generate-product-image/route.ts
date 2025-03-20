import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  // Use the correct environment variable - either GEMINI_API_KEY or GOOGLE_AI_API_KEY
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    console.error("Missing Gemini API key in environment variables");
    return NextResponse.json({
      success: false,
      error: "Server configuration error: Missing API key"
    }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    const { base64Image, mimeType } = await req.json();

    // Read reference image
    const refImagePath = path.join(process.cwd(), 'public/fruits/strawberrie.jpeg');
    const refImageBuffer = await fs.readFile(refImagePath);
    const refImageBase64 = refImageBuffer.toString('base64');

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    const prompt = "Generate a professional ecommerce product image that matches the following style reference. Match the composition, lighting, and background quality of the reference image. The generated image should look like it belongs in the same product catalog.";

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: refImageBase64
        }
      },
      {
        inlineData: {
          mimeType: mimeType,
          data: base64Image
        }
      }
    ]);

    const response = await result.response;
    const imagePart = response.candidates?.[0]?.content?.parts
      ?.find(part => part.inlineData);

    if (!imagePart?.inlineData) {
      throw new Error('No image generated');
    }

    return NextResponse.json({
      success: true,
      image: imagePart.inlineData.data
    });

  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Image generation failed"
    }, { status: 500 });
  }
}
