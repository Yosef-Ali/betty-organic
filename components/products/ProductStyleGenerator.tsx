'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Palette, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface ProductStyleGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
  productContext?: {
    name?: string;
    category?: string;
  };
}

const PRODUCT_CATEGORIES = {
  'fruits-vegetables': {
    name: 'Fruits & Vegetables',
    description: 'Fresh, vibrant, natural organic produce',
    stylePrompt: 'Professional studio photography of fresh organic produce, clean white background, natural lighting, crisp details, vibrant colors, commercial product photography style.',
    examples: ['Organic Tomatoes', 'Fresh Apples', 'Leafy Greens', 'Root Vegetables']
  },
  'bottles': {
    name: 'Bottles & Liquids',
    description: 'Premium bottles, oils, wines, beverages',
    stylePrompt: 'Elegant product photography of premium bottles, clean minimalist background, sophisticated lighting, glass reflections, luxury commercial style.',
    examples: ['Olive Oil', 'Wine Bottles', 'Juice Bottles', 'Vinegar']
  },
  'packaged-goods': {
    name: 'Packaged Goods',
    description: 'Packaged foods, containers, branded products',
    stylePrompt: 'Clean commercial product photography of packaged goods, consistent lighting, professional presentation, brand-focused styling.',
    examples: ['Cheese Packages', 'Pasta Boxes', 'Tea Bags', 'Snack Packages']
  }
};

export function ProductStyleGenerator({ onImageGenerated, productContext }: ProductStyleGeneratorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string>('');
  const [lastUsedProvider, setLastUsedProvider] = useState<string>('');
  const { toast } = useToast();

  const generateImage = async () => {
    if (!selectedCategory || !prompt.trim()) return;

    setIsGenerating(true);

    try {
      const category = PRODUCT_CATEGORIES[selectedCategory as keyof typeof PRODUCT_CATEGORIES];
      const fullPrompt = `${category.stylePrompt} Product: ${prompt}`;

      const response = await fetch('/api/generate-product-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: fullPrompt,
          provider: 'huggingface-free', // Use free Hugging Face API
          style: selectedCategory,
          quality: 'hd',
          size: '1024x1024'
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      const imageUrl = data.imageUrl.startsWith('data:') ? data.imageUrl : `data:image/png;base64,${data.imageUrl}`;
      setGeneratedImage(imageUrl);
      setLastUsedProvider(data.provider || 'Unknown');
      
      toast({
        title: 'Success!',
        description: `Generated ${category.name.toLowerCase()} image using ${data.provider || 'AI provider'}.`,
      });
    } catch (error) {
      console.error('Generation error:', error);
      
      let errorMessage = 'Failed to generate image';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check for common issues
      if (errorMessage.includes('API key not configured')) {
        errorMessage = 'AI service not configured. Please check your environment variables.';
      } else if (errorMessage.includes('HTTP 401')) {
        errorMessage = 'Authentication failed. Please check your API keys.';
      } else if (errorMessage.includes('HTTP 429')) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      }
      
      toast({
        title: 'Generation Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseImage = () => {
    if (generatedImage) {
      onImageGenerated(generatedImage);
      toast({
        title: 'Image Applied',
        description: 'The generated image has been added to your product.',
      });
    }
  };

  // Auto-fill prompt based on product context
  const autoFillPrompt = () => {
    if (!productContext) return;
    
    const { name, category } = productContext;
    if (name) {
      setPrompt(name);
      
      // Auto-select category based on product category
      if (category?.toLowerCase().includes('fruit') || category?.toLowerCase().includes('vegetable')) {
        setSelectedCategory('fruits-vegetables');
      } else if (name.toLowerCase().includes('bottle') || name.toLowerCase().includes('oil') || name.toLowerCase().includes('wine')) {
        setSelectedCategory('bottles');
      } else {
        setSelectedCategory('packaged-goods');
      }
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Palette className="h-5 w-5" />
          Consistent Style Generator (FREE)
        </CardTitle>
        <CardDescription>
          Generate images with consistent styles for your 3 product categories using free AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Product Category</label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Choose your product category" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRODUCT_CATEGORIES).map(([key, category]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="font-medium">{category.name}</div>
                      <div className="text-xs text-muted-foreground">{category.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Show selected category info */}
        {selectedCategory && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-medium">
                {PRODUCT_CATEGORIES[selectedCategory as keyof typeof PRODUCT_CATEGORIES].name}
              </span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
              {PRODUCT_CATEGORIES[selectedCategory as keyof typeof PRODUCT_CATEGORIES].description}
            </p>
            <div className="flex flex-wrap gap-1">
              {PRODUCT_CATEGORIES[selectedCategory as keyof typeof PRODUCT_CATEGORIES].examples.map((example, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {example}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Product Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Product Description</label>
            {productContext && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoFillPrompt}
                className="text-xs"
              >
                Auto-fill from product
              </Button>
            )}
          </div>
          <Textarea
            placeholder="Enter your product name/description (e.g., organic tomatoes, olive oil bottle, cheese package)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={generateImage}
          disabled={isGenerating || !selectedCategory || !prompt.trim()}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Consistent Style...
            </>
          ) : (
            <>
              <Palette className="h-4 w-4 mr-2" />
              Generate FREE AI Image
            </>
          )}
        </Button>

        {/* Generated Image Preview */}
        {generatedImage && (
          <div className="space-y-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
              <Image
                src={generatedImage}
                alt="Generated product image"
                fill
                className="object-cover"
              />
            </div>
            {lastUsedProvider && (
              <div className="text-xs text-muted-foreground text-center">
                Generated using: {lastUsedProvider}
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={handleUseImage}
                className="flex-1"
                variant="default"
              >
                Use This Image
              </Button>
              <Button
                onClick={() => generateImage()}
                variant="outline"
                className="flex-1"
              >
                Generate Another
              </Button>
            </div>
          </div>
        )}

        {/* Style Guide */}
        <div className="text-xs text-muted-foreground p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <strong>🎉 Completely FREE:</strong> Uses Hugging Face free AI + smart placeholders. 
          No API keys needed, no costs, unlimited usage!
        </div>
      </CardContent>
    </Card>
  );
}
