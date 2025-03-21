import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, Part } from "@google/generative-ai";

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

    const formData = await req.formData();
    const imageFile = formData.get("image") as File;
    const prompt = formData.get("prompt")?.toString() || "Transform this into a professional product image";

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert image to base64
    const buffer = await imageFile.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");
    const mimeType = imageFile.type;

    // Prepare parts array with correct typing
    const parts: Part[] = [
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64Image
        }
      }
    ];

    const result = await model.generateContent(parts);
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
