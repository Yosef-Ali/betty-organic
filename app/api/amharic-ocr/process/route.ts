import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import { Mistral } from '@mistralai/mistralai';

interface OCRResponse {
  extractedText: string;
  markdown: string;
  images: { [key: string]: string };
  metadata: {
    pages: number;
    language: string;
    confidence: number;
  };
}

// Simulated Mistral OCR processing (replace with actual Mistral OCR when available)
async function simulateMistralOCR(filePath: string, fileName: string): Promise<OCRResponse> {
  // This is a simulation - in real implementation, you would use Mistral OCR API
  // For now, we'll create a realistic response structure
  
  const isAmharic = fileName.includes('amharic') || fileName.includes('አማርኛ');
  
  const sampleAmharicText = `
# የኢትዮጵያ ዋና ጽህፈት ቤት

## ዋነኛ መረጃዎች

የተቀበሉት ሰነዶች:
- የእውቅና ማረጋገጫ
- የአማርኛ ሰነድ
- የትምህርት ማረጋገጫ

### ዝርዝር ሀሳቦች

ይህ ሰነድ የያዘው ዋና ዋና ነጥቦች:

1. **የአማርኛ ጽሁፍ ማነባበር** - በጣም አስፈላጊ ነው
2. **የሰነድ ምደባ** - ትክክለኛ መረጃ
3. **የመረጃ ማረጋገጫ** - ውጤታማ ሂደት

| ቁጥር | ርዕስ | ዓይነት |
|-------|------|--------|
| 1 | የመጀመሪያ ሰነድ | ወረቀት |
| 2 | የሁለተኛ ሰነድ | ዲጂታል |
| 3 | የሦስተኛ ሰነድ | ምስል |

### ዋና ውጤቶች

በዚህ የአማርኛ ሰነድ ውስጥ የተመዘገቡት ውጤቶች በጣም ጠቃሚ ናቸው። እነዚህም:

- ውጤታማ የመረጃ ማስተላለፍ
- ትክክለኛ የቋንቋ ማግኘት  
- በቀላሉ የሚነበብ ይዘት

**ማሳሰቢያ:** ይህ ሰነድ በ2024 የተዘጋጀ ነው።
`;

  const sampleEnglishText = `
# Document Processing Report

## Executive Summary

This document contains important information regarding:
- Document verification
- Text extraction
- Content analysis

### Key Findings

The processed document shows:

1. **High OCR Accuracy** - 95% confidence level
2. **Proper Structure** - Well-formatted content
3. **Multiple Languages** - English and Amharic content detected

| Item | Type | Status |
|------|------|--------|
| Text | Primary | Processed |
| Images | Secondary | Extracted |
| Tables | Structured | Organized |

### Recommendations

Based on the analysis:
- Continue with multimodal processing
- Maintain language detection accuracy
- Enhance table extraction capabilities

**Note:** This analysis was completed in 2024.
`;

  return {
    extractedText: isAmharic ? sampleAmharicText : sampleEnglishText,
    markdown: isAmharic ? sampleAmharicText : sampleEnglishText,
    images: {
      "image_1": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
    },
    metadata: {
      pages: 1,
      language: isAmharic ? 'amharic' : 'english',
      confidence: 0.95
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const apiKey = formData.get('apiKey') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Mistral API key is required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF or image files.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Create temporary file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const tempDir = '/tmp';
    const fileName = `ocr_${Date.now()}_${file.name}`;
    const filePath = path.join(tempDir, fileName);
    
    await writeFile(filePath, buffer);

    try {
      // Process with simulated Mistral OCR
      const ocrResult = await simulateMistralOCR(filePath, file.name);
      
      // In a real implementation, you would use:
      // const mistral = new Mistral({ apiKey });
      // const ocrResult = await mistral.ocr.process({ file: filePath, language: 'amharic' });
      
      return NextResponse.json(ocrResult);
      
    } finally {
      // Clean up temporary file
      try {
        await unlink(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
    }

  } catch (error) {
    console.error('OCR processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process document' },
      { status: 500 }
    );
  }
}