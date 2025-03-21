import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { Input } from "@/components/ui/input";

interface ProductImageGeneratorProps {
  onImageGenerated?: (imageData: string) => void;
}

export function ProductImageGenerator({ onImageGenerated }: ProductImageGeneratorProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim()) {
      setError("Please enter a product description");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-product-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      // Use the imageUrl from the response
      setGeneratedImage(data.imageUrl);

      if (onImageGenerated && data.image) {
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
          <CardTitle>Product Description</CardTitle>
          <CardDescription>Describe the product you want to generate</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center">
          <div className="w-full space-y-4">
            <Input
              placeholder="Enter product description (e.g., 'Organic honey jar with honeycomb')"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full"
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            onClick={generateImage}
            disabled={!prompt.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
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
                  : "Enter a description and click 'Generate Professional Image'"}
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
