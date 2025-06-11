import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface OCRData {
  extractedText: string;
  markdown: string;
  images: { [key: string]: string };
  metadata: {
    pages: number;
    language: string;
    confidence: number;
  };
}

interface ChatRequest {
  message: string;
  ocrData: OCRData;
  apiKey: string;
  chatHistory: ChatMessage[];
}

function buildAmharicContextPrompt(ocrData: OCRData, userMessage: string, chatHistory: ChatMessage[]): string {
  const systemPrompt = `
You are an advanced AI assistant specialized in analyzing Amharic and multilingual documents. You have been provided with OCR-extracted content from a document and must answer user questions about it.

**IMPORTANT INSTRUCTIONS:**
1. You can understand and respond in both Amharic (አማርኛ) and English
2. If the user asks in Amharic, respond in Amharic
3. If the user asks in English, respond in English
4. Always base your answers on the provided document content
5. If information is not in the document, clearly state that
6. For Amharic text, maintain proper Ge'ez script formatting
7. Be accurate and helpful while staying within the document context

**DOCUMENT METADATA:**
- Pages: ${ocrData.metadata.pages}
- Language: ${ocrData.metadata.language}
- OCR Confidence: ${(ocrData.metadata.confidence * 100).toFixed(1)}%

**EXTRACTED DOCUMENT CONTENT:**
${ocrData.markdown}

**CHAT HISTORY:**
${chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

**USER QUESTION:**
${userMessage}

Please provide a comprehensive answer based on the document content. If the question requires information not present in the document, politely explain what information is available instead.
`;

  return systemPrompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, ocrData, apiKey, chatHistory } = body;

    if (!message || !ocrData || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: message, ocrData, or apiKey' },
        { status: 400 }
      );
    }

    if (!message.trim()) {
      return NextResponse.json(
        { error: 'Message cannot be empty' },
        { status: 400 }
      );
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Use Gemini 1.5 Pro for better multilingual support
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro",
      generationConfig: {
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    });

    // Build the context-aware prompt
    const prompt = buildAmharicContextPrompt(ocrData, message, chatHistory || []);

    // Generate response
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      return NextResponse.json(
        { error: 'No response generated from AI model' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      response: text,
      metadata: {
        model: "gemini-1.5-pro",
        timestamp: new Date().toISOString(),
        documentLanguage: ocrData.metadata.language,
        confidenceScore: ocrData.metadata.confidence
      }
    });

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle specific Google AI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid or missing Google API key' },
          { status: 401 }
        );
      }
      
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'API quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    );
  }
}