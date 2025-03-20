import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Server configuration error: Missing API key" },
        { status: 500 }
      );
    }

    // Parse the request body
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const prompt = formData.get("prompt") as string || "A professional product image with clean background";

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
    const dataURI = `data:${imageFile.type};base64,${base64Image}`;

    // Generate image using OpenAI
    const response = await openai.images.edit({
      image: await fetch(dataURI).then(r => r.blob()),
      prompt,
      n: 1,
      size: "1024x1024",
    });

    // Return the generated image URL
    return NextResponse.json({ imageUrl: response.data[0].url });

  } catch (error: any) {
    console.error("Error generating image:", error);
    return NextResponse.json(
      { error: `Error generating image: ${error.message}` },
      { status: 500 }
    );
  }
}
