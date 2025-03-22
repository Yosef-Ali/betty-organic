"use client";
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Upload } from 'lucide-react';

type FileWithPreview = {
  file: File;
  preview: string;
};

export default function SimpleImageGenerator() {
  const [prompt, setPrompt] = useState<string>("Add professional product lighting");
  const [sourceImage, setSourceImage] = useState<FileWithPreview | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    try {
      // Create form data to send the file
      const formData = new FormData();
      formData.append('image', sourceImage.file);
      formData.append('prompt', prompt);

      const response = await fetch('/api/generate-product-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImage(data.imageUrl);
    } catch (err: any) {
      console.error('Error generating image:', err);
      setError(err.message || 'Image generation failed. Please try again later.');
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

  return (
    <div className="flex flex-col space-y-6">
      <div className="grid gap-4">
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
            {sourceImage ? 'Change Image' : 'Select Image'}
          </Button>
        </div>

        {sourceImage && (
          <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
              <img
                src={sourceImage.preview}
                alt="Source"
                className="object-cover"
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

      {isLoading && !generatedImage && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {generatedImage && (
        <div className="w-full flex justify-center">
          <img
            src={generatedImage}
            alt="Generated image"
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>
      )}
    </div>
  );
}
