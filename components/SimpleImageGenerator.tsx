"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, ZoomIn, RotateCcw, Lightbulb, ArrowLeftRight, AlertCircle, Info } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define TypeScript interfaces for better type safety
interface FileWithPreview {
  file: File;
  preview: string;
}

interface ProgressStatus {
  stage: 'uploading' | 'processing' | 'generating' | 'complete';
  message: string;
}

interface ErrorWithTips {
  message: string;
  troubleshooting?: string[];
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
    original: {
      name: string;
      size: number;
      type: string;
    };
    fallback?: boolean;
  };
}

export default function SimpleImageGenerator() {
  // State using TypeScript types
  const [prompt, setPrompt] = useState<string>("Add professional product lighting");
  const [sourceImage, setSourceImage] = useState<FileWithPreview | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ErrorWithTips | null>(null);
  const [progress, setProgress] = useState<ProgressStatus | null>(null);
  const [sideBySideView, setSideBySideView] = useState(true);
  const [usedFallback, setUsedFallback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to update progress state
  const updateProgress = (stage: ProgressStatus['stage'], message: string) => {
    setProgress({ stage, message });
  };

  // Handle file selection with proper type safety
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setSourceImage({ file, preview });
    setError(null);
  };

  // Generate image with proper async/await pattern
  const generateImage = async () => {
    if (!sourceImage?.file || !prompt.trim()) {
      setError({
        message: "Please select an image and enter a description"
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(null);
    setGeneratedImage(null);
    setOriginalImageUrl(null);
    setUsedFallback(false);

    try {
      updateProgress('uploading', 'Preparing your image...');
      const formData = new FormData();
      formData.append('image', sourceImage.file);
      formData.append('prompt', prompt);

      updateProgress('processing', 'Uploading image to Gemini 2.0...');

      // Log details for debugging
      console.log('Sending request to API with form data',
        { promptValue: prompt, imageFileName: sourceImage.file.name, imageSize: sourceImage.file.size });

      // Use Next.js 15 fetch with proper error handling
      const response = await fetch('/api/image-generation', {
        method: 'POST',
        body: formData,
      });

      updateProgress('generating', 'Generating enhanced product image with Gemini 2.0 Flash...');

      if (!response.ok) {
        const errorData = await response.json() as ImageGenerationResponse;
        throw new Error(JSON.stringify({
          message: errorData.error || `Server error: ${response.status}`,
          troubleshooting: errorData.troubleshooting || []
        }));
      }

      const data = await response.json() as ImageGenerationResponse;

      if (!data.success) {
        throw new Error(JSON.stringify({
          message: data.error || 'Failed to generate image',
          troubleshooting: data.troubleshooting || []
        }));
      }

      if (!data.imageUrl) {
        throw new Error(JSON.stringify({
          message: 'No valid image was generated. Please try a different prompt or image.',
          troubleshooting: [
            "Use a clearer image with better lighting",
            "Try a simpler enhancement prompt",
            "Ensure your image has a clear subject"
          ]
        }));
      }

      updateProgress('complete', 'Enhancement complete!');
      console.log('Image generation success:', data);
      setGeneratedImage(data.imageUrl);
      setOriginalImageUrl(data.originalImageUrl || null);

      // Check if fallback was used
      setUsedFallback(data.metadata?.fallback === true);
    } catch (err: any) {
      console.error('Image generation error:', err);

      // Try to parse the error to get troubleshooting tips
      try {
        const parsedError = JSON.parse(err.message);
        setError({
          message: parsedError.message || 'Failed to enhance image. Please try again.',
          troubleshooting: parsedError.troubleshooting
        });
      } catch (parseErr) {
        // Handle specific error cases if parsing fails
        if (err.message.includes('No valid image')) {
          setError({
            message: 'Image Generation Error: No valid image was generated.',
            troubleshooting: [
              "Use a clearer image with better lighting",
              "Try a simpler enhancement prompt",
              "Ensure your image has a clear subject",
              "Try a different image format (JPG or PNG)"
            ]
          });
        } else {
          setError({
            message: err.message || 'Failed to enhance image. Please try again.'
          });
        }
      }

      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup preview URL on unmount or when source image changes - React 18 pattern
  React.useEffect(() => {
    return () => {
      if (sourceImage?.preview) {
        URL.revokeObjectURL(sourceImage.preview);
      }
    };
  }, [sourceImage]);

  // Suggestion prompts for better results
  const suggestionPrompts = [
    "Add professional product lighting",
    "Remove background and make it pure white",
    "Add soft shadows beneath the product",
    "Enhance colors and make it look premium",
    "Add a subtle gradient background",
    "Make it look like a professional catalog photo",
    "Simple clean enhancement with good lighting"
  ];

  const applyPromptSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const toggleView = () => {
    setSideBySideView(!sideBySideView);
  };

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid gap-4">
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <h3 className="font-medium text-blue-800 flex items-center gap-2 mb-2">
            <Lightbulb className="h-4 w-4" />
            Powered by Gemini 2.0 Flash Image Generation
          </h3>
          <p className="text-sm text-blue-700">
            Upload any product photo and enhance it with professional quality using Google&apos;s newest AI image generation model. All images are generated at exactly 500x500 pixels.
          </p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />

        <div className="flex gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {sourceImage ? 'Change Image' : 'Select Product Image'}
          </Button>
        </div>

        {sourceImage && (
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
              <Image
                src={sourceImage.preview}
                alt="Source"
                className="object-cover"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            <div className="flex gap-2">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter enhancement instructions..."
                className="flex-1"
              />
              <Button
                onClick={generateImage}
                disabled={isLoading || !prompt.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enhancing...
                  </>
                ) : (
                  "Enhance"
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestionPrompts.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => applyPromptSuggestion(suggestion)}
                  className="text-xs"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Image Generation Error</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>{error.message}</p>
            {error.troubleshooting && error.troubleshooting.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">Troubleshooting tips:</p>
                <ul className="list-disc pl-5 text-sm space-y-1">
                  {error.troubleshooting.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {usedFallback && generatedImage && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Alternative AI service used</AlertTitle>
          <AlertDescription>
            Our primary AI service couldn&apos;t generate this image, but our backup service was able to create it successfully.
          </AlertDescription>
        </Alert>
      )}

      {(isLoading || generatedImage) && (
        <div className="flex flex-col items-center gap-6 py-4">
          {isLoading && (
            <div className="flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              {progress && (
                <div>
                  <p className="text-lg font-medium capitalize">
                    {progress.stage}...
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {progress.message}
                  </p>
                </div>
              )}
            </div>
          )}

          {generatedImage && (
            <div className="w-full rounded-lg border bg-card p-6 shadow-sm">
              {originalImageUrl && generatedImage && (
                <div className="mb-4 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleView}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeftRight className="h-4 w-4" />
                    {sideBySideView ? "Switch to Single View" : "Switch to Side-by-Side"}
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Image */}
                {(sideBySideView || (!sideBySideView && !originalImageUrl)) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Original Image</h3>
                    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                      <Image
                        src={originalImageUrl || sourceImage?.preview || ''}
                        alt="Original product"
                        className="object-contain"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
                        500 x 500
                      </div>
                    </div>
                  </div>
                )}

                {/* Generated Image */}
                {(sideBySideView || (!sideBySideView && originalImageUrl)) && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Enhanced Image</h3>
                    <div
                      className="relative aspect-square w-full overflow-hidden rounded-md bg-muted"
                      role="button"
                      tabIndex={0}
                      onClick={() => window.open(generatedImage, '_blank')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          window.open(generatedImage, '_blank');
                        }
                      }}
                    >
                      <Image
                        src={generatedImage}
                        alt="Enhanced product image - Click or press Enter to view full size"
                        className="object-contain hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                      <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
                        500 x 500
                      </div>
                    </div>

                    {progress?.stage === 'complete' && (
                      <>
                        <div className="flex flex-col gap-4">
                          <div className="flex justify-center gap-2">
                            <Button
                              onClick={() => window.open(generatedImage, '_blank')}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <ZoomIn className="h-4 w-4" />
                              View Full Size
                            </Button>
                            <Button
                              onClick={() => {
                                setGeneratedImage(null);
                                setProgress(null);
                              }}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Try Another
                            </Button>
                          </div>
                          <div className="text-center">
                            <p className="text-sm text-muted-foreground">
                              Image enhancement completed successfully with Gemini 2.0 Flash. Images are generated at 500x500 pixels for optimal display.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
