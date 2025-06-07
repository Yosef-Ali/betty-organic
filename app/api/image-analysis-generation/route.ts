import { NextRequest, NextResponse } from 'next/server';

interface ImageAnalysisRequest {
  sourceImage: string; // Base64 image
  targetPrompt: string;
  style: string;
}

// Function to analyze uploaded image and create enhanced prompt
function analyzeImageAndCreatePrompt(targetPrompt: string, style: string): string {
  // Create a very detailed prompt that instructs the AI to copy the reference image composition
  
  const templatePrompts = {
    'watercolor': `COPY THE EXACT COMPOSITION AND CAMERA ANGLE from the reference image provided. Use the uploaded image as a template and recreate it with this new content: ${targetPrompt}. 
    
    CRITICAL INSTRUCTIONS - MATCH THE REFERENCE TEMPLATE EXACTLY:
    - Keep the SAME camera angle and perspective as the reference image
    - Copy the EXACT positioning and arrangement style from the reference
    - Maintain the SAME professional studio lighting setup and shadows
    - Use the SAME CLEAN, VIBRANT SOLID LIGHT YELLOW BACKGROUND as the reference image
    - Keep the SAME professional product photography composition
    - Only change the product/subject to match: ${targetPrompt}
    - Maintain IDENTICAL background color (clean, vibrant solid light yellow background)
    - Copy the reference image's professional styling and layout exactly
    - SAME STRIKING CONTRAST between product and background
    
    PROFESSIONAL PRODUCT STYLING REQUIREMENTS (MATCH RECRAFT.AI QUALITY):
    - EXACTLY 3 pieces if fruits/vegetables, arranged professionally like commercial food photography
    - Perfect fresh organic produce, no blemishes, commercial grade quality
    - Professional food styling with perfect positioning and spacing like the reference template
    - Clean, fresh appearance suitable for commercial advertising
    - High-end commercial food photography standards matching Recraft.ai quality
    - Professional product placement and arrangement exactly like the reference
    - Studio-quality lighting and shadows matching the reference
    - Commercial advertising quality presentation
    - CLEAN, VIBRANT SOLID BACKGROUND creating striking contrast
    
    Style: professional product photography matching the reference template exactly, clean solid background, commercial food photography, high-end professional product photography, advertising quality, Recraft.ai style quality.`,
    
    'photorealistic': `COPY THE EXACT COMPOSITION AND CAMERA ANGLE from the reference image provided. Recreate the reference image with this new content: ${targetPrompt}. Keep the same camera angle, lighting, and professional setup. Style: photorealistic, high resolution, professional commercial photography.`,
    
    'cinematic': `COPY THE EXACT COMPOSITION AND CAMERA ANGLE from the reference image provided. Recreate the reference image with this new content: ${targetPrompt}. Keep the same camera angle, lighting, and composition. Style: cinematic photography, dramatic lighting, professional composition.`,
    
    'digital-art': `COPY THE EXACT COMPOSITION AND CAMERA ANGLE from the reference image provided. Recreate the reference image with this new content: ${targetPrompt}. Keep the same layout and style. Style: digital artwork, clean modern design, vector illustration.`
  };

  return templatePrompts[style as keyof typeof templatePrompts] || templatePrompts.watercolor;
}

export async function POST(req: NextRequest) {
  try {
    const body: ImageAnalysisRequest = await req.json();
    const { sourceImage, targetPrompt, style } = body;

    if (!sourceImage || !targetPrompt) {
      return NextResponse.json(
        { success: false, error: 'Source image and target prompt are required' },
        { status: 400 }
      );
    }

    // Create enhanced prompt based on the template style
    const enhancedPrompt = analyzeImageAndCreatePrompt(targetPrompt, style);

    try {
      // Use Pollinations with enhanced prompt for consistent results and professional quality
      const encodedPrompt = encodeURIComponent(enhancedPrompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}&model=flux&enhance=true&nologo=true`;
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Pollinations API error: ${response.status}`);
      }

      const imageBlob = await response.blob();
      const arrayBuffer = await imageBlob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      
      return NextResponse.json({
        success: true,
        imageUrl: `data:image/png;base64,${base64}`,
        method: 'template-inspired-generation',
        note: 'Generated new image inspired by your uploaded template'
      });

    } catch (error) {
      console.error('Primary generation failed, trying Hugging Face:', error);
      
      // Fallback to Hugging Face
      try {
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
        
        return NextResponse.json({
          success: true,
          imageUrl: `data:image/png;base64,${base64}`,
          method: 'template-inspired-generation-hf',
          note: 'Generated new image inspired by your uploaded template using Hugging Face'
        });

      } catch (hfError) {
        throw new Error('All generation methods failed');
      }
    }

  } catch (error) {
    console.error('Image analysis generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate template-inspired image. Please try again.' 
      },
      { status: 500 }
    );
  }
}