"use client";
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, ZoomIn, RotateCcw, Lightbulb } from 'lucide-react';
import Image from 'next/image';

type FileWithPreview = {
  file: File;
  preview: string;
};

interface ProgressStatus {
  stage: 'uploading' | 'processing' | 'generating' | 'complete';
  message: string;
}

export default function SimpleImageGenerator() {
  const [prompt, setPrompt] = useState<string>("Add professional product lighting");
  const [sourceImage, setSourceImage] = useState<FileWithPreview | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProgress = (stage: ProgressStatus['stage'], message: string) => {
    setProgress({ stage, message });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setSourceImage({ file, preview });
    setError(null);
  };

  const generateImage = async () => {
    if (!sourceImage?.file || !prompt.trim()) {
      setError("Please select an image and enter a description");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(null);
    setGeneratedImage(null);

    try {
      updateProgress('uploading', 'Preparing your image...');
      const formData = new FormData();
      formData.append('image', sourceImage.file);
      formData.append('prompt', prompt);

      updateProgress('processing', 'Uploading image to Gemini 2.0...');
      const response = await fetch('/api/generate-product-image', {
        method: 'POST',
        body: formData,
      });

      updateProgress('generating', 'Generating enhanced product image with Gemini 2.0 Flash...');
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      updateProgress('complete', 'Enhancement complete!');
      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || 'Failed to enhance image. Please try again.');
      setProgress(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup preview URL on unmount or when source image changes
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
    "Make it look like a professional catalog photo"
  ];

  const applyPromptSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
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
            Upload any product photo and enhance it with professional quality using Google&apos;s newest AI image generation model.
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-medium text-red-800 mb-2">Image Generation Error</h3>
          <div className="text-red-700 whitespace-pre-line">
            {error}
          </div>
          {error.includes('Alternative services') && (
            <p className="mt-4 text-sm text-red-600">
              Note: We&apos;re working on integrating a dedicated image generation service. Thank you for your patience.
            </p>
          )}
        </div>
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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Source Image */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Original Image</h3>
                    <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
                      <Image
                        src={sourceImage?.preview || ''}
                        alt="Original product"
                        className="object-contain"
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  </div>

                  {/* Generated Image */}
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
                        Click to view full size
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
                              Image enhancement completed successfully with Gemini 2.0 Flash. You can view the full size or try another enhancement.
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
