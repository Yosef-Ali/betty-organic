import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, RefreshCw } from "lucide-react";
import Image from "next/image";

interface ProductImageGeneratorProps {
  onImageGenerated?: (imageData: string) => void;
}

export function ProductImageGenerator({ onImageGenerated }: ProductImageGeneratorProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setOriginalImage(event.target.result as string);
        setGeneratedImage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const generateImage = async () => {
    if (!originalImage) return;

    setIsLoading(true);
    setError(null);

    try {
      // Extract the base64 data from the data URL
      const base64Data = originalImage.split(',')[1];
      const mimeType = originalImage.split(';')[0].split(':')[1];

      const response = await fetch('/api/generate-product-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image: base64Data,
          mimeType,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      // Construct the data URL for the generated image
      const newImageDataUrl = `data:image/jpeg;base64,${data.image}`;
      setGeneratedImage(newImageDataUrl);

      if (onImageGenerated) {
        onImageGenerated(data.image);
      }
    } catch (err) {
      console.error('Error generating image:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Original Product Photo</CardTitle>
          <CardDescription>Upload a photo of your product</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {originalImage ? (
            <div className="relative w-full aspect-square">
              <Image
                src={originalImage}
                alt="Original product"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div
              onClick={handleUploadClick}
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <Upload className="w-10 h-10 mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Click to upload a product image</p>
            </div>
          )}

          {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleUploadClick}>
            Change Image
          </Button>
          <Button
            onClick={generateImage}
            disabled={!originalImage || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Generate Professional Image
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generated Professional Image</CardTitle>
          <CardDescription>
            AI-generated professional product image
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          {generatedImage ? (
            <div className="relative w-full aspect-square">
              <Image
                src={generatedImage}
                alt="Generated product"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-64 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">
                {isLoading
                  ? "Generating professional image..."
                  : originalImage
                    ? "Click 'Generate Professional Image' to start"
                    : "Upload an image first"}
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          {generatedImage && (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = generatedImage;
                link.download = 'professional-product-image.jpg';
                link.click();
              }}
            >
              Download Image
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
