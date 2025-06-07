import { NextRequest, NextResponse } from 'next/server';

// Define truly free providers only - perfect for customer presentations
export type AIProvider = 'huggingface-free' | 'pollinations-free' | 'placeholder';

interface GenerateImageRequest {
  prompt: string;
  provider?: AIProvider;
  style?: 'photorealistic' | 'cinematic' | 'digital-art' | '3d-render' | 'watercolor';
  aspectRatio?: '1:1' | '4:3' | '16:9' | '9:16' | '3:4';
  quality?: 'standard' | 'hd';
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  sourceImage?: string; // Base64 image for image-to-image
  mode?: 'text-to-image' | 'image-to-image';
  strength?: number; // How much to transform the source image (0.1 to 1.0)
}

interface AIProviderConfig {
  name: string;
  description: string;
  maxSize: string;
  strengths: string[];
  category: 'free';
}

const AI_PROVIDERS: Record<AIProvider, AIProviderConfig> = {
  'huggingface-free': {
    name: 'Hugging Face AI',
    description: 'Professional quality Stable Diffusion - completely free',
    maxSize: '1024x1024',
    strengths: ['Completely free', 'No API key required', 'Professional quality', 'Great for products'],
    category: 'free'
  },
  'pollinations-free': {
    name: 'Pollinations AI',
    description: 'Fast & reliable free image generation with no limits',
    maxSize: '1024x1024',
    strengths: ['Lightning fast', 'No rate limits', 'Always available', 'Great for demos'],
    category: 'free'
  },
  'placeholder': {
    name: 'Instant Preview',
    description: 'Smart styled placeholders for immediate results',
    maxSize: '1024x1024',
    strengths: ['Instant generation', 'Always works', 'No limits', 'Perfect for wireframes'],
    category: 'free'
  }
};

function enhancePromptForProductPhotography(prompt: string, style?: string, mode?: string, templateStyle?: string): string {
  const baseEnhancement = mode === 'image-to-image' 
    ? "Using the uploaded reference image as EXACT template, recreate with this description: "
    : "Professional product photography, high quality, commercial grade, ";
  
  const styleEnhancements = {
    photorealistic: "photorealistic, studio lighting, clean background, sharp details, ",
    cinematic: "cinematic lighting, dramatic shadows, film-like quality, ",
    'digital-art': "digital art style, clean vector graphics, modern design, ",
    '3d-render': "3D rendered, realistic materials, professional modeling, ",
    watercolor: "watercolor background, artistic illustration style, soft brushstrokes, painted effect, "
  };

  // Enhanced template-specific styling for different product categories
  const templateEnhancements = {
    fruits: mode === 'image-to-image' 
      ? "EXACTLY 3 pieces of fresh organic fruit, SAME camera angle as reference image, artistic watercolor background with soft yellow and orange gradient tones, close-up product photography, professional food styling, soft natural lighting, artistic painted background, commercial food photography style, consistent watercolor wash background, "
      : "EXACTLY 3 pieces of fresh organic fruit, TOP VIEW camera angle, overhead shot, artistic watercolor background with soft yellow and orange gradient tones, close-up product photography, professional food styling, soft natural lighting, artistic painted background, commercial food photography style, consistent watercolor wash background, shot from above, ",
    vegetables: mode === 'image-to-image'
      ? "EXACTLY 3 pieces of fresh organic vegetables, SAME camera angle as reference image, artistic watercolor background with warm earth tone gradients, close-up organic vegetable photography, fresh produce styling, soft studio lighting, painted artistic background, commercial food photography, consistent watercolor wash background, "
      : "EXACTLY 3 pieces of fresh organic vegetables, TOP VIEW camera angle, overhead shot, artistic watercolor background with warm earth tone gradients, close-up organic vegetable photography, fresh produce styling, soft studio lighting, painted artistic background, commercial food photography, consistent watercolor wash background, shot from above, ",
    bottles: mode === 'image-to-image'
      ? "EXACTLY 1 bottle product, SAME camera angle as reference image, professional bottle photography, clean product shot, artistic watercolor background with consistent gradient wash, commercial product photography, studio lighting, simple watercolor background, "
      : "EXACTLY 1 bottle product, TOP VIEW camera angle, overhead shot, professional bottle photography, clean product shot, artistic watercolor background with consistent gradient wash, commercial product photography, studio lighting, simple watercolor background, shot from above, ",
    packages: mode === 'image-to-image'
      ? "EXACTLY 1 package product, SAME camera angle as reference image, professional packaging photography, clean product presentation, artistic watercolor background with consistent gradient wash, commercial product photography, studio lighting, simple watercolor background, "
      : "EXACTLY 1 package product, TOP VIEW camera angle, overhead shot, professional packaging photography, clean product presentation, artistic watercolor background with consistent gradient wash, commercial product photography, studio lighting, simple watercolor background, shot from above, ",
    default: mode === 'image-to-image'
      ? "SAME camera angle as reference image, artistic watercolor background with consistent gradient wash, professional product photography, soft artistic lighting, painted background effect, simple watercolor wash, "
      : "TOP VIEW camera angle, overhead shot, artistic watercolor background with consistent gradient wash, professional product photography, soft artistic lighting, painted background effect, simple watercolor wash, shot from above, "
  };

  const enhancement = styleEnhancements[style as keyof typeof styleEnhancements] || styleEnhancements.watercolor;
  
  // Determine template style based on prompt content
  let templateStyle_auto = templateStyle || 'default';
  if (prompt.toLowerCase().includes('fruit') || prompt.toLowerCase().includes('apple') || prompt.toLowerCase().includes('orange') || prompt.toLowerCase().includes('tomato')) {
    templateStyle_auto = 'fruits';
  } else if (prompt.toLowerCase().includes('vegetable') || prompt.toLowerCase().includes('carrot') || prompt.toLowerCase().includes('pepper')) {
    templateStyle_auto = 'vegetables';
  } else if (prompt.toLowerCase().includes('bottle') || prompt.toLowerCase().includes('oil') || prompt.toLowerCase().includes('juice')) {
    templateStyle_auto = 'bottles';
  } else if (prompt.toLowerCase().includes('bag') || prompt.toLowerCase().includes('package') || prompt.toLowerCase().includes('packaging')) {
    templateStyle_auto = 'packages';
  }

  const templateEnhancement = templateEnhancements[templateStyle_auto as keyof typeof templateEnhancements];
  
  const transformationNote = mode === 'image-to-image' 
    ? ". EXACTLY copy the camera angle, composition, lighting, background style, and professional photography setup from the reference image. Keep the SAME camera angle and perspective as the original. Only change the product to match the new description while maintaining IDENTICAL composition, lighting, background, and camera angle. "
    : ", consistent artistic watercolor background, no text overlay, no extra elements, TOP VIEW camera angle, overhead shot, ";
  
  const finalInstruction = mode === 'image-to-image' 
    ? "high resolution, professional food photography, consistent style, not too creative, follow instructions exactly, EXACT same camera angle as reference image"
    : "high resolution, professional food photography, consistent style, not too creative, follow instructions exactly, TOP VIEW camera angle, overhead shot";
  
  return baseEnhancement + templateEnhancement + enhancement + prompt + transformationNote + finalInstruction;
}

// Pollinations AI - Fast & Free (No API key required!)
async function generateWithPollinationsFree(request: GenerateImageRequest): Promise<string> {
  const enhancedPrompt = enhancePromptForProductPhotography(request.prompt, request.style, request.mode, 'fruits');
  
  try {
    // For image-to-image, redirect to the proper image analysis API
    if (request.mode === 'image-to-image' && request.sourceImage) {
      throw new Error('IMAGE_TO_IMAGE_REDIRECT');
    } else {
      // Regular text-to-image generation with reduced creativity for consistency
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}&nologo=true&enhance=true`;
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Pollinations API error: ${response.status}`);
      }

      const imageBlob = await response.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      return `data:image/png;base64,${base64}`;
    }
  } catch (error) {
    console.warn('Pollinations generation failed, trying Hugging Face:', error);
    // Fallback to Hugging Face if Pollinations fails
    return generateWithHuggingFaceFree(request);
  }
}

// Hugging Face Free Inference API (No API key required!)
async function generateWithHuggingFaceFree(request: GenerateImageRequest): Promise<string> {
  const enhancedPrompt = enhancePromptForProductPhotography(request.prompt, request.style, request.mode, 'fruits');
  
  try {
    // Note: Hugging Face free tier doesn't support true image-to-image
    // For image-to-image mode, we redirect to the template-inspired generation
    if (request.mode === 'image-to-image' && request.sourceImage) {
      throw new Error('Use /api/image-analysis-generation for template-inspired generation');
    }

    // Regular text-to-image
    const response = await fetch('https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: enhancedPrompt,
        options: { 
          wait_for_model: true,
          use_cache: false 
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const imageBlob = await response.blob();
    const arrayBuffer = await imageBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.warn('Hugging Face generation failed, falling back to placeholder:', error);
    // Fallback to placeholder if HF fails
    return generatePlaceholder(request);
  }
}

// Smart placeholder generator with product-appropriate styling
function generatePlaceholder(request: GenerateImageRequest): string {
  const { prompt, style } = request;
  const width = 1024;
  const height = 1024;
  
  // Style-based color schemes
  const styleSchemes = {
    'photorealistic': {
      bg: '#f8fafc',
      primary: '#3b82f6',
      accent: '#e2e8f0',
      text: '#1f2937'
    },
    'cinematic': {
      bg: '#0f172a',
      primary: '#f59e0b',
      accent: '#374151',
      text: '#f1f5f9'
    },
    'digital-art': {
      bg: '#f0f9ff',
      primary: '#8b5cf6',
      accent: '#c7d2fe',
      text: '#312e81'
    },
    'watercolor': {
      bg: '#fef7ed',
      primary: '#06b6d4',
      accent: '#fed7aa',
      text: '#7c2d12'
    },
    '3d-render': {
      bg: '#f9fafb',
      primary: '#ef4444',
      accent: '#d1d5db',
      text: '#111827'
    }
  };
  
  const scheme = styleSchemes[style as keyof typeof styleSchemes] || styleSchemes.photorealistic;
  
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${scheme.bg};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${scheme.accent};stop-opacity:0.3" />
        </linearGradient>
        <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" style="stop-color:${scheme.primary};stop-opacity:0.2" />
          <stop offset="100%" style="stop-color:${scheme.primary};stop-opacity:0.05" />
        </radialGradient>
      </defs>
      
      <rect width="100%" height="100%" fill="url(#bgGradient)"/>
      <circle cx="50%" cy="45%" r="200" fill="url(#centerGlow)"/>
      
      <!-- Product representation -->
      <rect x="30%" y="30%" width="40%" height="40%" fill="${scheme.primary}" opacity="0.8" rx="20"/>
      <rect x="35%" y="35%" width="30%" height="30%" fill="${scheme.accent}" opacity="0.6" rx="15"/>
      
      <!-- Style indicator -->
      <circle cx="85%" cy="15%" r="40" fill="${scheme.primary}" opacity="0.3"/>
      
      <!-- Product name -->
      <text x="50%" y="75%" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="32" font-weight="bold" fill="${scheme.text}">
        ${prompt.slice(0, 20)}${prompt.length > 20 ? '...' : ''}
      </text>
      
      <!-- Style label -->
      <text x="50%" y="82%" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="16" fill="${scheme.text}" opacity="0.7">
        ${(style || 'product').charAt(0).toUpperCase() + (style || 'product').slice(1)} Style
      </text>
      
      <!-- Quality badge -->
      <text x="50%" y="88%" text-anchor="middle" font-family="Arial, sans-serif" 
            font-size="12" fill="${scheme.text}" opacity="0.5">
        Betty Organic - AI Generated
      </text>
    </svg>
  `;
  
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}

// Get the best available free provider for demos
function getBestAvailableProvider(): AIProvider {
  // Pollinations is fastest and most reliable for demos
  return 'pollinations-free';
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateImageRequest = await req.json();
    let { prompt, provider, style, aspectRatio, quality, size, sourceImage, mode, strength } = body;

    if (!prompt?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Validate image-to-image requirements
    if (mode === 'image-to-image' && !sourceImage) {
      return NextResponse.json(
        { success: false, error: 'Source image is required for image-to-image generation' },
        { status: 400 }
      );
    }

    // Auto-select provider if none specified
    if (!provider) {
      provider = getBestAvailableProvider();
    }

    // Set default mode if not specified
    if (!mode) {
      mode = sourceImage ? 'image-to-image' : 'text-to-image';
    }

    let imageUrl: string;

    // Handle image-to-image mode by using the specialized image analysis API
    if (mode === 'image-to-image' && sourceImage) {
      try {
        // Call our image analysis API internally
        const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/image-analysis-generation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sourceImage: sourceImage,
            targetPrompt: prompt,
            style: style || 'watercolor'
          }),
        });

        const analysisData = await analysisResponse.json();
        
        if (analysisData.success) {
          imageUrl = analysisData.imageUrl;
        } else {
          throw new Error(analysisData.error || 'Image analysis failed');
        }
      } catch (analysisError) {
        console.error('Image analysis API failed:', analysisError);
        // Fallback to text-to-image with enhanced prompt
        switch (provider) {
          case 'pollinations-free':
            imageUrl = await generateWithPollinationsFree({ ...body, mode: 'text-to-image' });
            break;
          case 'huggingface-free':
            imageUrl = await generateWithHuggingFaceFree({ ...body, mode: 'text-to-image' });
            break;
          default:
            imageUrl = await generateWithPollinationsFree({ ...body, mode: 'text-to-image' });
            break;
        }
      }
    } else {
      // Regular text-to-image generation
      switch (provider) {
        case 'pollinations-free':
          imageUrl = await generateWithPollinationsFree({ ...body, mode });
          break;
        case 'huggingface-free':
          imageUrl = await generateWithHuggingFaceFree({ ...body, mode });
          break;
        case 'placeholder':
          imageUrl = generatePlaceholder({ ...body, mode });
          break;
        default:
          // Default to fastest free option for demos
          imageUrl = await generateWithPollinationsFree({ ...body, mode });
          break;
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl,
      provider: provider,
      prompt: body.prompt,
      mode: mode,
      hasSourceImage: !!sourceImage
    });

  } catch (error) {
    console.error('Image generation error:', error);
    
    // Always provide a fallback
    try {
      const fallbackImage = generatePlaceholder({
        prompt: body?.prompt || 'Product Image',
        style: body?.style || 'photorealistic'
      });
      
      return NextResponse.json({
        success: true,
        imageUrl: fallbackImage,
        provider: 'placeholder',
        prompt: body?.prompt || 'Product Image',
        note: 'Generated placeholder due to API error'
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to generate image or placeholder' 
        },
        { status: 500 }
      );
    }
  }
}

export async function GET() {
  // Return only truly free providers - perfect for customer presentations
  const providersArray = Object.entries(AI_PROVIDERS).map(([key, config]) => ({
    provider: key,
    config
  }));
  
  return NextResponse.json({
    success: true,
    providers: providersArray,
    defaultProvider: 'pollinations-free',
    totalProviders: providersArray.length,
    note: 'All providers are completely free - perfect for demos and presentations!'
  });
}
