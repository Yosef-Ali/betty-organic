import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
    const model = genAI.getGenerativeModel({
      model: "gemini-pro-vision",
    });

    const data = await req.json();
    const prompt = data.prompt || "";

    if (!prompt) {
      return NextResponse.json(
        { error: "No text prompt provided" },
        { status: 400 }
      );
    }

    const result = await model.generateContent(prompt);
    const response = result.response;

    // Validate and extract image data from response
    if (!response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
      return NextResponse.json(
        { error: "No image data in Gemini response" },
        { status: 500 }
      );
    }

    const imageData = response.candidates[0].content.parts[0].inlineData.data;
    const mimeType = response.candidates[0].content.parts[0].inlineData.mimeType || "image/png";
    const imageUrl = `data:${mimeType};base64,${imageData}`;

    return NextResponse.json({
      success: true,
      imageUrl: imageUrl
    });

  } catch (error: any) {
    console.error("Gemini image generation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
