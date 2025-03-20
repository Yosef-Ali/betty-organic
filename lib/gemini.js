// Import the Google Generative AI library
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the API with the key from environment variables
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Check if API key exists
if (!apiKey) {
  console.error("NEXT_PUBLIC_GEMINI_API_KEY is not defined in environment variables");
}

// Initialize the API
const genAI = new GoogleGenerativeAI(apiKey);

export default genAI;
// ...existing code...
