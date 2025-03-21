import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    // Use the hardcoded API key as a fallback if the environment variable isn't set
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyCtkGu1fqi4VZbGCA1fxludMnnp5TYDXrw';

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing Gemini API key" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
    });

    const data = await req.json();
    const prompt = data.prompt || "";

    if (!prompt) {
      return NextResponse.json(
        { error: "No text prompt provided" },
        { status: 400 }
      );
    }

    console.log("Generating image with prompt:", prompt);

    const generationConfig = {
      temperature: 1,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    };

    // Create a chat session which is closer to what the working example does
    const chatSession = model.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);
    const response = result.response;

    // Log the response structure to help debug
    console.log("Response structure:", JSON.stringify(response, null, 2));

    if (!response.candidates?.[0]?.content?.parts) {
      return NextResponse.json(
        { error: "Invalid response from Gemini image generation service" },
        { status: 500 }
      );
    }

    // Look for image data in the parts
    const imagePart = response.candidates[0].content.parts.find(
      part => part.fileData?.mimeType?.startsWith("image/") ||
        part.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart) {
      return NextResponse.json(
        { error: "No image data in Gemini response" },
        { status: 500 }
      );
    }

    // Handle either fileData or inlineData
    let imageUrl;
    let imageData;

    if (imagePart.fileData) {
      imageUrl = imagePart.fileData.fileUri;
      imageData = null; // We don't have the base64 data if it's a fileUri
    } else if (imagePart.inlineData) {
      imageData = imagePart.inlineData.data;
      imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imageData}`;
    }

    return NextResponse.json({
      success: true,
      image: imageData,
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

// const {
//   GoogleGenerativeAI,
//   HarmCategory,
//   HarmBlockThreshold,
// } = require("@google/generative-ai");
// const { GoogleAIFileManager } = require("@google/generative-ai/server");

// const apiKey = process.env.GEMINI_API_KEY;
// const genAI = new GoogleGenerativeAI(apiKey);
// const fileManager = new GoogleAIFileManager(apiKey);

// /**
//  * Uploads the given file to Gemini.
//  *
//  * See https://ai.google.dev/gemini-api/docs/prompting_with_media
//  */
// async function uploadToGemini(path, mimeType) {
//   const uploadResult = await fileManager.uploadFile(path, {
//     mimeType,
//     displayName: path,
//   });
//   const file = uploadResult.file;
//   console.log(`Uploaded file ${file.displayName} as: ${file.name}`);
//   return file;
// }

// const model = genAI.getGenerativeModel({
//   model: "gemini-2.0-flash-exp-image-generation",
// });

// const generationConfig = {
//   temperature: 1,
//   topP: 0.95,
//   topK: 40,
//   maxOutputTokens: 8192,
//   responseMimeType: "text/plain",
// };

// async function run() {
//   // TODO Make these files available on the local file system
//   // You may need to update the file paths
//   const files = [
//     await uploadToGemini("image_croissant.jpeg", "image/jpeg"),
//     await uploadToGemini("", "image/png"),
//     await uploadToGemini("strawberrie.jpeg", "image/jpeg"),
//     await uploadToGemini("", "image/png"),
//     await uploadToGemini("", "image/png"),
//     await uploadToGemini("oliv.jpg", "image/jpeg"),
//     await uploadToGemini("", "image/png"),
//   ];

//   const chatSession = model.startChat({
//     generationConfig,
//     history: [
//       {
//         role: "user",
//         parts: [
//           {
//             fileData: {
//               mimeType: files[0].mimeType,
//               fileUri: files[0].uri,
//             },
//           },
//           {text: "Add some chocolate drizzle to the croissants."},
//         ],
//       },
//       {
//         role: "model",
//         parts: [
//           {
//             fileData: {
//               mimeType: files[1].mimeType,
//               fileUri: files[1].uri,
//             },
//           },
//         ],
//       },
//       {
//         role: "user",
//         parts: [
//           {
//             fileData: {
//               mimeType: files[2].mimeType,
//               fileUri: files[2].uri,
//             },
//           },
//           {text: "make it banana\n"},
//         ],
//       },
//       {
//         role: "model",
//         parts: [
//           {
//             fileData: {
//               mimeType: files[3].mimeType,
//               fileUri: files[3].uri,
//             },
//           },
//         ],
//       },
//       {
//         role: "user",
//         parts: [
//           {text: "the same product image for olive oile bottles"},
//         ],
//       },
//       {
//         role: "model",
//         parts: [
//           {
//             fileData: {
//               mimeType: files[4].mimeType,
//               fileUri: files[4].uri,
//             },
//           },
//         ],
//       },
//       {
//         role: "user",
//         parts: [
//           {
//             fileData: {
//               mimeType: files[5].mimeType,
//               fileUri: files[5].uri,
//             },
//           },
//           {text: "applay similar backgroud proftional product shoot\n"},
//         ],
//       },
//       {
//         role: "model",
//         parts: [
//           {
//             fileData: {
//               mimeType: files[6].mimeType,
//               fileUri: files[6].uri,
//             },
//           },
//         ],
//       },
//     ],
//   });

//   const result = await chatSession.sendMessage("INSERT_INPUT_HERE");
//   console.log(result.response.text());
// }

// run();
