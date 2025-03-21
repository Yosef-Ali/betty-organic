import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation"
    });

    const data = await req.json();
    const prompt = data.prompt || "A professional product image";

    if (!prompt) {
      return NextResponse.json(
        { error: "No prompt provided" },
        { status: 400 }
      );
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (!response?.candidates?.[0]?.content?.parts) {
      return NextResponse.json(
        { error: "Invalid response from image generation service" },
        { status: 500 }
      );
    }

    const imageData = response.candidates[0].content.parts.find(
      part => part.inlineData?.mimeType?.startsWith("image/")
    )?.inlineData;

    if (!imageData) {
      return NextResponse.json(
        { error: "No image data in response" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      image: imageData.data,
      imageUrl: `data:${imageData.mimeType};base64,${imageData.data}`
    });

  } catch (error: any) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
