import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Check if API key is configured
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: Missing Gemini API key" },
        { status: 500 }
      );
    }

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    // Parse the request body
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const prompt = formData.get("prompt") as string || "Transform this into a professional product image with clean background";

    // Validate input
    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const mimeType = imageFile.type;

    // Prepare image parts for Gemini
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType
      }
    };

    // Generate content using Gemini
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const imageData = response?.candidates?.[0]?.content?.parts?.find(
      part => part.inlineData?.mimeType?.startsWith("image/")
    )?.inlineData;

    if (!imageData) {
      return NextResponse.json(
        { error: "Failed to generate image" },
        { status: 500 }
      );
    }

    // Return the generated image data
    return NextResponse.json({
      imageUrl: `data:${imageData.mimeType};base64,${imageData.data}`
    });

  } catch (error: any) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: `Error generating image: ${error.message}` },
      { status: 500 }
    );
  }
}
