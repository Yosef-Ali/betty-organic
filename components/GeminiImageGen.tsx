"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Loader2, Upload, ZoomIn, RefreshCcw } from 'lucide-react';

// Defining types for better type safety
interface GeminiImageGenProps {
  apiKey: string;
}

interface UploadedFile {
  file: File;
  preview: string;
}

interface GenerationResult {
  loading: boolean;
  error: string | null;
  generatedImageUrl: string | null;
}

interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  originalImageUrl?: string;
  error?: string;
  troubleshooting?: string[];
  metadata?: {
    mimeType: string;
    model: string;
    dimensions: string;
    processedAt: string;
  };
}

const GeminiImageGen: React.FC<GeminiImageGenProps> = ({ apiKey }) => {
  // State with proper typing
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [generationResult, setGenerationResult] = useState<GenerationResult>({
    loading: false,
    error: null,
    generatedImageUrl: null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection with proper type checking
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const preview = URL.createObjectURL(file);

    setUploadedFiles([...uploadedFiles, { file, preview }]);
  };

  // Generate image with proper async/await and error handling
  const generateImage = async () => {
    if (uploadedFiles.length === 0) {
      setGenerationResult({
        loading: false,
        error: 'Please upload at least one image',
        generatedImageUrl: null,
      });
      return;
    }

    if (!prompt.trim()) {
      setGenerationResult({
        loading: false,
        error: 'Please enter a prompt',
        generatedImageUrl: null,
      });
      return;
    }

    try {
      setGenerationResult({
        loading: true,
        error: null,
        generatedImageUrl: null,
      });

      // Create form data to send to the server
      const formData = new FormData();
      formData.append('image', uploadedFiles[0].file);
      formData.append('prompt', prompt);

      // Send to our image generation API with proper typing for response
      const response = await fetch('/api/image-generation', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json() as ImageGenerationResponse;
        throw new Error(errorData.error || 'Failed to generate image');
      }

      const data = await response.json() as ImageGenerationResponse;

      if (!data.success || !data.imageUrl) {
        throw new Error('Failed to generate image');
      }

      // Set the generated image URL
      setGenerationResult({
        loading: false,
        error: null,
        generatedImageUrl: data.imageUrl,
      });

    } catch (error) {
      setGenerationResult({
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
        generatedImageUrl: null,
      });
    }
  };

  // Clean up object URLs when component unmounts - React 18 pattern
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [uploadedFiles]);

  // Reset the form to initial state
  const handleReset = () => {
    // Cleanup existing previews before resetting
    uploadedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });

    setUploadedFiles([]);
    setPrompt('');
    setGenerationResult({
      loading: false,
      error: null,
      generatedImageUrl: null,
    });
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Upload Reference Image</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploadedFiles.length > 0 ? 'Change Image' : 'Select Image'}
            </Button>

            {uploadedFiles.length > 0 && (
              <div className="relative aspect-square w-full overflow-hidden rounded-md">
                <Image
                  src={uploadedFiles[0].preview}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            )}

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Example: 'Add some chocolate drizzle to the croissants' or 'Convert to professional product image'"
              className="h-24 resize-none"
            />
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <Button
            variant="ghost"
            onClick={handleReset}
            disabled={generationResult.loading}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={generateImage}
            disabled={generationResult.loading || uploadedFiles.length === 0 || !prompt.trim()}
          >
            {generationResult.loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Image'
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Image</CardTitle>
        </CardHeader>
        <CardContent className="min-h-[300px] flex flex-col">
          {generationResult.error && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
              {generationResult.error}
            </div>
          )}

          <div className="flex-1 flex items-center justify-center">
            {generationResult.generatedImageUrl ? (
              <div className="relative aspect-square w-full overflow-hidden rounded-md">
                <Image
                  src={generationResult.generatedImageUrl}
                  alt="Generated image"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <Button
                  size="sm"
                  className="absolute bottom-4 right-4"
                  onClick={() => window.open(generationResult.generatedImageUrl!, '_blank')}
                >
                  <ZoomIn className="mr-2 h-4 w-4" />
                  View Full Size
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 w-full border-2 border-dashed border-gray-300 rounded-md p-6 text-center">
                {generationResult.loading ? (
                  <>
                    <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                    <p>Processing your image with AI...</p>
                    <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg mb-2">No image generated yet</p>
                    <p className="text-sm text-gray-500">
                      Upload an image and enter a prompt to generate a modified version
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-2 mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold text-lg mb-2">How to use</h3>
        <ol className="list-decimal pl-5">
          <li className="mb-1">Upload a reference image</li>
          <li className="mb-1">Enter a prompt describing the desired modification</li>
          <li className="mb-1">Click "Generate Image" to create a modified version</li>
        </ol>
        <p className="mt-2 text-sm text-gray-600">
          Example prompts:
          <br />- "Add some chocolate drizzle to the croissants"
          <br />- "Convert this to a professional product image with clean background"
          <br />- "Make this strawberry image look like bananas"
        </p>
      </div>
    </div>
  );
};

export default GeminiImageGen;
