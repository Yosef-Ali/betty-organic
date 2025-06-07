'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles, Wand2, Zap, Cpu, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

export type AIProvider = 'huggingface-diffusers' | 'cloudflare-workers-ai' | 'openai-dall-e-3' | 'gemini-pro-vision' | 'gemini-flash' | 'stability-ai';

interface AIImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
  productContext?: {
    name?: string;
    category?: string;
    description?: string;
  };
}

const PROVIDER_ICONS = {
  'openai-dall-e-3': <Sparkles className="h-4 w-4" />,
  'gemini-pro-vision': <Cpu className="h-4 w-4" />,
  'gemini-flash': <Zap className="h-4 w-4" />,
  'stability-ai': <Wand2 className="h-4 w-4" />
};

const PROVIDER_INFO = {
  'huggingface-diffusers': {
    name: 'Hugging Face Diffusers',
    description: 'Free community models with 75 images/day',
    badge: 'Free 75/day',
    badgeVariant: 'secondary' as const
  },
  'cloudflare-workers-ai': {
    name: 'Cloudflare Workers AI',
    description: 'Fast free community tier',
    badge: 'Free',
    badgeVariant: 'secondary' as const
  },
  'openai-dall-e-3': {
    name: 'DALL-E 3',
    description: 'Premium OpenAI model (requires payment)',
    badge: 'Premium',
    badgeVariant: 'default' as const
  },
  'gemini-pro-vision': {
    name: 'Gemini Pro Vision',
    description: 'Excellent for professional photography',
    badge: 'Pro',
    badgeVariant: 'default' as const
  },
  'gemini-flash': {
    name: 'Gemini Flash',
    description: 'Fast and cost-effective',
    badge: 'Fast',
    badgeVariant: 'outline' as const
  },
  'stability-ai': {
    name: 'Stable Diffusion XL',
    description: 'Great for artistic styles',
    badge: 'Artistic',
    badgeVariant: 'destructive' as const
  }
};

export function AIImageGenerator({ onImageGenerated, productContext }: AIImageGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<AIProvider>('huggingface-diffusers');
  const [style, setStyle] = useState('photorealistic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const { toast } = useToast();

  // Auto-generate prompt based on product context
  const generateSmartPrompt = () => {
    if (!productContext) return;
    
    const { name, category, description } = productContext;
    let smartPrompt = '';
    
    if (name) {
      smartPrompt += `Professional product photo of ${name}`;
    }
    
    if (category && category !== 'All') {
      const categoryDesc = category.replace(/_/g, ' ').toLowerCase();
      smartPrompt += `, ${categoryDesc} category`;
    }
    
    if (description) {
      smartPrompt += `, featuring ${description.substring(0, 100)}`;
    }
    
    smartPrompt += ', clean studio background, professional lighting, high quality, commercial photography';
    
    setPrompt(smartPrompt);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a description for your product image.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const response = await fetch('/api/generate-product-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          provider,
          style,
          quality: 'hd',
          size: '1024x1024'
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      setGeneratedImage(data.imageUrl);
      toast({
        title: 'Success!',
        description: 'Your product image has been generated successfully.',
      });
    } catch (error) {
      console.error('Generation error:', error);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate image',
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
        title: 'Image Selected',
        description: 'The generated image has been added to your product.',
      });
    }
  };

  return (
    <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImageIcon className="h-5 w-5" />
          AI Image Generator
        </CardTitle>
        <CardDescription>
          Generate professional product images using the latest AI models
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* AI Provider Selection */}
        <div className="space-y-2">
          <Label>AI Model</Label>
          <Select value={provider} onValueChange={(value: AIProvider) => setProvider(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PROVIDER_INFO).map(([key, info]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex items-center gap-2">
                    {PROVIDER_ICONS[key as AIProvider]}
                    <span>{info.name}</span>
                    <Badge variant={info.badgeVariant} className="text-xs">
                      {info.badge}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {PROVIDER_INFO[provider].description}
          </p>
        </div>

        {/* Style Selection */}
        <div className="space-y-2">
          <Label>Style</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="photorealistic">Photorealistic</SelectItem>
              <SelectItem value="cinematic">Cinematic</SelectItem>
              <SelectItem value="digital-art">Digital Art</SelectItem>
              <SelectItem value="3d-render">3D Render</SelectItem>
              <SelectItem value="watercolor">Watercolor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating with {PROVIDER_INFO[provider].name}...
            </>
          ) : (
            <>
              {PROVIDER_ICONS[provider]}
              <span className="ml-2">Generate Image</span>
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
            <Button
              onClick={handleUseImage}
              className="w-full"
              variant="outline"
            >
              Use This Image
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
