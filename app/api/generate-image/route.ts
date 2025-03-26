// src/app/api/generate-image/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  Part,
} from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import os from 'os';

// --- Configuration ---
const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Model specific configuration
const model = genAI.getGenerativeModel({
  // IMPORTANT: Verify this model name.
  model: "gemini-2.0-flash-exp-image-generation", //seems experimental or potentially incorrect.
  // Common vision model is "gemini-pro-vision" (text out) or "gemini-1.5-flash" / "gemini-1.5-pro" (multimodal)
  // For pure Image Generation, Google often uses "Imagen" models via Vertex AI or other specific APIs.
  // Let's proceed assuming this model *does* accept image+text and outputs image, as implied by original script.
  // If it fails, you might need "gemini-1.5-flash" or check Google's documentation for the correct image generation/editing model available via the Gemini SDK.
  //model: 'gemini-1.5-flash-latest', // Using a known multimodal model as a placeholder
  // model: "gemini-2.0-flash-exp-image-generation", // Original model - use if confirmed
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  // responseMimeType: 'text/plain', // This likely needs to be changed if expecting image output.
  // The SDK usually handles response format automatically based on model capabilities.
  // Let's remove it for now and see what the model returns.
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// --- Helper Functions ---

async function uploadToGemini(filePath: string, mimeType: string): Promise<any> {
  console.log(`Uploading file: ${filePath}, MIME Type: ${mimeType}`);
  try {
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName: path.basename(filePath),
    });
    const file = uploadResult.file;
    console.log(`Uploaded file ${file.displayName} as: ${file.name} (URI: ${file.uri})`);
    // IMPORTANT: Gemini File API URIs are usually NOT directly accessible via HTTP.
    // They are identifiers for the model to use internally.
    return file; // Return the file object including name and uri
  } catch (error) {
    console.error("Error uploading file to Gemini:", error);
    // It might be useful to delete the temporary file here if upload fails
    // await fs.promises.unlink(filePath);
    throw new Error(`Failed to upload file to Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper to parse FormData
async function parseFormData(req: NextRequest): Promise<{ fields: formidable.Fields<string>; files: formidable.Files<string> }> {
  const form = formidable({
    uploadDir: os.tmpdir(), // Save temporary files to OS temp directory
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // Example: 10MB limit
  });

  return new Promise((resolve, reject) => {
    // formidable expects Node.js IncomingMessage, NextRequest's body needs adaptation
    // We can work directly with the stream
    // @ts-ignore - formidable types might not perfectly align with NextRequest stream types
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error("Formidable parsing error:", err);
        return reject(new Error(`Failed to parse form data: ${err.message}`));
      }
      // console.log("Parsed fields:", fields);
      // console.log("Parsed files:", files);
      resolve({ fields, files });
    });
  });
}

// --- API Route Handler ---

// Next.js App Router configuration - FIXED: using the correct export configuration
export const dynamic = 'force-dynamic'; // Ensure route is not statically optimized
export const runtime = 'nodejs'; // Required for file operations (formidable)

export async function POST(req: NextRequest) {
  console.log('Received POST request to /api/generate-image');
  let tempFilePath: string | null = null;
  let geminiFileName: string | null = null;

  try {
    const { fields, files } = await parseFormData(req);

    const promptField = fields.prompt;
    const prompt = Array.isArray(promptField) ? promptField[0] : promptField;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }
    console.log('Received prompt:', prompt);

    const inputFile = files.inputFile ? (Array.isArray(files.inputFile) ? files.inputFile[0] : files.inputFile) : null;
    let uploadedGeminiFile: any = null;

    // --- Upload Input File (if provided) ---
    if (inputFile && inputFile.filepath && inputFile.mimetype) {
      tempFilePath = inputFile.filepath; // Keep track for cleanup
      console.log(`Temporary file path: ${tempFilePath}`);
      if (!fs.existsSync(tempFilePath)) {
        throw new Error(`Temporary file does not exist at path: ${tempFilePath}`);
      }
      uploadedGeminiFile = await uploadToGemini(tempFilePath, inputFile.mimetype);
      geminiFileName = uploadedGeminiFile.name; // Keep track for potential cleanup
    } else {
      console.log("No input file provided or file data is invalid.");
    }

    // --- Prepare Request for Gemini ---
    const parts: Part[] = [];
    if (uploadedGeminiFile) {
      parts.push({
        fileData: {
          mimeType: uploadedGeminiFile.mimeType,
          fileUri: uploadedGeminiFile.uri, // Use the URI provided by Gemini File API
        },
      });
    }
    parts.push({ text: prompt }); // Add the text prompt

    console.log("Sending request to Gemini model with parts:", JSON.stringify(parts, null, 2));

    // --- Call Gemini API ---
    const result = await model.generateContent({
      contents: [{ role: 'user', parts }],
      generationConfig,
      safetySettings,
    });

    console.log("Received response from Gemini.");

    // --- Process Response ---
    if (!result.response) {
      console.error("Gemini response is missing.");
      throw new Error('No response received from Gemini.');
    }

    const responseParts = result.response.candidates?.[0]?.content?.parts;
    if (!responseParts || responseParts.length === 0) {
      const blockReason = result.response.promptFeedback?.blockReason;
      console.error("Gemini response has no parts. Block Reason:", blockReason);
      throw new Error(`Gemini response contained no usable parts. ${blockReason ? `Reason: ${blockReason}` : ''}`);
    }

    // Find the image part in the response
    // Adjust this based on the *actual* model output format!
    const imagePart = responseParts.find(part => part.fileData);
    const textPart = responseParts.find(part => part.text); // Also capture any text

    if (imagePart && imagePart.fileData) {
      console.log("Found fileData in response:", imagePart.fileData);
      // Assuming fileData contains mimeType and fileUri
      // We CANNOT directly use the fileUri. We need to get the *content*.
      // The Node SDK currently lacks a direct `getFileContent(uri)` method.
      // Workaround: Use the REST API or check if the model can return base64 directly.
      // For now, we'll return the URI and mimeType, but the frontend won't be able to display it directly.
      // TODO: Implement fetching content from fileUri if necessary or adjust model/response handling.
      // A common pattern with other Google APIs (like Imagen) is getting a signed URL or direct bytes. Check Gemini docs.

      // *** Placeholder: Returning URI - Requires Frontend Adjustment or Backend Fetch ***
      return NextResponse.json({
        imageUrl: null, // Indicate direct URL not available
        fileUri: imagePart.fileData.fileUri, // Pass URI for potential later use/debugging
        mimeType: imagePart.fileData.mimeType,
        message: textPart?.text ?? "Generated image data received (URI). Cannot display directly.",
      });

      // *** Ideal (if model could return base64 or we could fetch): ***
      // const imageData = await fetchImageDataFromUri(imagePart.fileData.fileUri); // Hypothetical function
      // const base64Url = `data:${imagePart.fileData.mimeType};base64,${imageData.toString('base64')}`;
      // return NextResponse.json({ imageUrl: base64Url, message: textPart?.text });

    } else if (textPart) {
      console.log("Response contains only text:", textPart.text);
      // Handle cases where the model might just return text (e.g., explaining why it can't fulfill the request)
      return NextResponse.json({ imageUrl: null, message: textPart.text });
    } else {
      console.error("Response did not contain expected fileData or text.");
      throw new Error("Unexpected response format from Gemini.");
    }

  } catch (error: any) {
    console.error('API Route Error:', error);
    // Clean up temporary file if it exists
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
        console.log(`Cleaned up temporary file: ${tempFilePath}`);
      } catch (cleanupError) {
        console.error(`Failed to clean up temporary file ${tempFilePath}:`, cleanupError);
      }
    }
    // Potential: Clean up Gemini file if needed (use geminiFileName)
    // if (geminiFileName) {
    //    try {
    //        await fileManager.deleteFile(geminiFileName);
    //        console.log(`Cleaned up Gemini file: ${geminiFileName}`);
    //    } catch (deleteError) {
    //        console.error(`Failed to delete Gemini file ${geminiFileName}:`, deleteError);
    //    }
    // }

    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  } finally {
    // Ensure temp file is cleaned up even if Gemini upload succeeded but something else failed later
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
        console.log(`Cleaned up temporary file in finally block: ${tempFilePath}`);
      } catch (cleanupError) {
        console.error(`Failed to clean up temporary file ${tempFilePath} in finally:`, cleanupError);
      }
    }
  }
}
