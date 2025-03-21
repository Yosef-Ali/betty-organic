import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    // Use the API key directly from context
    const apiKey = "AIzaSyCtkGu1fqi4VZbGCA1fxludMnnp5TYDXrw";

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-pro"
    });

    const data = await req.json();
    const prompt = data.prompt || "A scenic landscape";

    // Simple call to generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // Extract image data from response
    const imageData = response.candidates[0].content.parts.find(
      part => part.inlineData?.mimeType?.startsWith("image/")
    )?.inlineData;

    if (!imageData) {
      return NextResponse.json(
        { error: "No image generated" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      imageUrl: `data:${imageData.mimeType};base64,${imageData.data}`
    });

  } catch (error: any) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error.message || "Error generating image" },
      { status: 500 }
    );
  }
}
