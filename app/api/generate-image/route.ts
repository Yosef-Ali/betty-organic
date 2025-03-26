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
async function getModelWithFallback() {
  const modelsToTry = [
    "gemini-2.0-flash-exp-image-generation",
    "gemini-1.5-flash-latest",
    "gemini-pro-vision"
  ];

  for (const modelName of modelsToTry) {
    try {
      const testModel = genAI.getGenerativeModel({ model: modelName });
      // Verify model availability with a simple prompt
      await testModel.generateContent("Test response");
      console.log(`Using model: ${modelName}`);
      return testModel;
    } catch (error: unknown) {
      console.warn(`Model ${modelName} unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error("No working image generation models available");
}

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
    const finalModel = await getModelWithFallback();
    const result = await finalModel.generateContent({
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
      try {
        // Get actual image content from file URI
        // Get file content and convert to base64
        const fileResponse = await fileManager.getFile(imagePart.fileData.fileUri);
        // Convert the file data to base64 - implementation depends on actual response type
        let base64Data: string;
        if ('data' in fileResponse && fileResponse.data instanceof Uint8Array) {
          base64Data = Buffer.from(fileResponse.data).toString('base64');
        } else {
          // Fallback if response format is different
          const response = await fetch(fileResponse.uri || imagePart.fileData.fileUri);
          base64Data = Buffer.from(await response.arrayBuffer()).toString('base64');
        }
        return NextResponse.json({
          success: true,
          imageUrl: `data:${imagePart.fileData.mimeType};base64,${base64Data}`,
          message: textPart?.text ?? "Image generated successfully"
        });
      } catch (fetchError: unknown) {
        console.error("Failed to fetch image content:", fetchError);
        return NextResponse.json({
          error: "Failed to retrieve generated image",
          details: fetchError instanceof Error ? fetchError.message : String(fetchError)
        }, { status: 500 });
      }

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

    let modelUsed = 'unknown';
    try {
      // Move finalModel declaration outside try block
      modelUsed = (await getModelWithFallback()).model || 'unknown';
    } catch { }
    return NextResponse.json({
      error: `Internal Server Error: ${error.message}`,
      modelUsed
    }, { status: 500 });
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
