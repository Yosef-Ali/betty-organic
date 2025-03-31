"use server"

import { StyleTemplateType } from "@/components/style-template-selector"
import { GoogleGenAI } from "@google/genai"

// Initialize the Google Generative AI client
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY || "" })

// System prompt for professional product images
const PRODUCT_IMAGE_SYSTEM_PROMPT = "Generate a professional product image"

// Define the product image templates - copied from style-template-selector.tsx
const PRODUCT_TEMPLATES = {
  "classic-product": {
    name: "Studio Professional",
    description: "Clean studio photography with professional lighting",
    prompt: "Create a high-quality product photograph designed for premium brand marketing. Position the product with professional composition, with subtle depth arrangement where applicable. Use a clean white or light complementary colored background that enhances but doesn't distract from the product. Ensure lighting is soft and even, with subtle highlights to emphasize product features and gentle shadows to add dimension. Include professional reflections appropriate for the product material. Capture all important product details with crystal clarity - textures, materials, and unique features should be visible. For packaged products, the label should be clearly visible with all text legible, properly positioned and professionally presented. The overall composition should be clean, commercial-quality, and visually appealing, with professional color correction that accurately represents the product. No text overlay. Professional macro/close-up shot with 1:1 aspect ratio."
  },
  "artistic-product": {
    name: "Artistic Watercolor",
    description: "Artistic watercolor-style product presentation",
    prompt: "Create a high-quality watercolor-style product illustration designed for premium packaging or marketing display. Use soft, delicate brushstrokes with gentle transitions between colors. Place the product on a clean, light yellow gradient background that transitions smoothly from pale yellow at the top to a slightly deeper shade at the bottom. Add a few small, translucent water droplets around the product to enhance the fresh, dewy look. Capture fine details that highlight the product's texture and features while maintaining an artistic watercolor aesthetic. The overall style should be realistic yet soft, with delicate watercolor shading, smooth color transitions, and a natural, organic feel. Ensure the composition is balanced and visually appealing, with no distracting elements, to make the product the clear focal point."
  },
  "lifestyle-product": {
    name: "Lifestyle Context",
    description: "Products shown in natural usage environments",
    prompt: "Create a lifestyle product photograph showing the product in its natural usage environment. Position the product as the clear focal point while incorporating contextual elements that suggest how and where the product is used. Use soft, natural lighting with gentle directional qualities that create a warm, inviting atmosphere - like morning sunlight through windows or soft indoor lighting. Apply a shallow depth of field focusing sharply on the product while gently blurring the background to create depth and context without distraction. Use a warm, inviting color palette that complements the product while creating a cohesive mood. Include thoughtfully arranged complementary props that tell a story about the product's purpose and lifestyle association without overwhelming the composition. For food or beverage products, show them in serving contexts that suggest enjoyment. The overall mood should feel authentic, aspirational and relatable, as if capturing a genuine moment in an idealized but believable environment."
  }
}

// Detailed template structure based on successful strawberry prompt - moved from client component
const DETAILED_PRODUCT_TEMPLATES = {
  "fruits-detailed": {
    basePrompt: "Create a high-quality watercolor-style product illustration featuring {productQuantifier} {productName} {productDescriptors}, designed for a premium food packaging or marketing display. The {productName} should be {colorDescription} {textureDescription}, showcasing a {surfaceQuality} texture with subtle light highlights to emphasize freshness and quality. Arrange the {productName} {arrangementDescription}, casting soft, natural shadows to add depth. Place them on a clean, light yellow gradient background that transitions smoothly from pale yellow at the top to a slightly deeper shade at the bottom, ensuring the focus remains on the {productName}. Add a few small, translucent water droplets around the {productName} to enhance the fresh, dewy look, with some droplets on the {productName} themselves and others scattered on the surface. The overall style should be realistic yet soft, with delicate watercolor shading, smooth color transitions, and a natural, organic feel. Ensure the composition is balanced and visually appealing, with no distracting elements, to make the {productName} the clear focal point for a product image."
  },
  "cosmetics-detailed": {
    basePrompt: "Create a high-quality watercolor-style product illustration featuring {productQuantifier} {productName} {productDescriptors}, designed for premium beauty packaging or marketing display. The {productName} should be {colorDescription} with {textureDescription}, showcasing a {surfaceQuality} finish that highlights its premium quality. Position the {productName} {arrangementDescription}, casting subtle, elegant shadows to add dimension. Place it on a clean, light pastel gradient background that transitions smoothly from a pale shade at the top to a slightly deeper tone at the bottom, ensuring the focus remains on the {productName}. Add delicate light reflections on the product surface to enhance the luxurious appearance. The overall style should be sophisticated yet soft, with delicate watercolor shading, smooth color transitions, and an elegant feel. Ensure the composition is balanced and visually appealing, with no distracting elements, to make the {productName} the clear focal point for a beauty product image."
  },
  "electronics-detailed": {
    basePrompt: "Create a high-quality watercolor-style product illustration featuring {productQuantifier} {productName} {productDescriptors}, designed for premium technology marketing. The {productName} should be {colorDescription} with {textureDescription}, showcasing a {surfaceQuality} finish that highlights its innovative design. Position the {productName} {arrangementDescription}, casting subtle, defined shadows to add dimension. Place it on a clean, light blue-gray gradient background that transitions smoothly from pale at the top to a slightly deeper shade at the bottom, ensuring the focus remains on the {productName}. Add subtle light reflections on key surfaces to enhance the modern appearance. The overall style should be contemporary yet artistic, with delicate watercolor shading, smooth color transitions, and a tech-forward feel. Ensure the composition is balanced and visually appealing, with no distracting elements, to make the {productName} the clear focal point for a technology product image."
  }
}

// Template variable defaults by product type - moved from client component
const TEMPLATE_VARIABLES = {
  "strawberries": {
    productQuantifier: "three ripe",
    productName: "strawberries",
    productDescriptors: "with their green leaves and stems intact",
    colorDescription: "vibrant red with small yellow seeds",
    textureDescription: "freshly washed",
    surfaceQuality: "glossy, juicy",
    arrangementDescription: "closely together, with one prominently in the foreground and two slightly behind"
  },
  "bananas": {
    productQuantifier: "three ripe",
    productName: "bananas",
    productDescriptors: "with curved shapes and slight green tips",
    colorDescription: "bright yellow with subtle brown speckles",
    textureDescription: "smooth-skinned",
    surfaceQuality: "matte, firm",
    arrangementDescription: "in a fan-like arrangement, with one prominently in the foreground"
  },
  "apples": {
    productQuantifier: "three shiny",
    productName: "apples",
    productDescriptors: "with small stems and leaves attached",
    colorDescription: "rich red with subtle green highlights",
    textureDescription: "polished",
    surfaceQuality: "glossy, firm",
    arrangementDescription: "in a triangular composition, with the largest one slightly forward"
  },
  "nuts": {
    productQuantifier: "a package of",
    productName: "cashew nuts",
    productDescriptors: "in a transparent plastic package with weight label",
    colorDescription: "light golden-beige",
    textureDescription: "dry with natural texture",
    surfaceQuality: "matte, crunchy-looking",
    arrangementDescription: "displayed in a clear plastic package with product weight visible on the label"
  },
  "packaged-food": {
    productQuantifier: "a package of",
    productName: "food product",
    productDescriptors: "in professional retail packaging with weight information",
    colorDescription: "brand-appropriate colors",
    textureDescription: "professionally packaged",
    surfaceQuality: "commercial-grade retail packaging",
    arrangementDescription: "displayed at a slight angle to show both the front label and product contents where applicable"
  },
  "face-cream": {
    productQuantifier: "an elegant",
    productName: "face cream jar",
    productDescriptors: "with a luxury gold-accented lid",
    colorDescription: "pearlescent white",
    textureDescription: "premium-looking",
    surfaceQuality: "smooth, sophisticated",
    arrangementDescription: "at a slight angle to showcase both the lid and the container"
  },
  "olive-oil": {
    productQuantifier: "three elegant",
    productName: "olive oil bottles",
    productDescriptors: "with premium labels and quality caps",
    colorDescription: "dark green glass with golden-yellow olive oil visible inside",
    textureDescription: "smooth glass with premium finish",
    surfaceQuality: "glossy, professional",
    arrangementDescription: "arranged with one prominent in the foreground and two slightly offset behind, creating depth"
  }
}

// More specific template for product-specific details - moved from client component
const PRODUCT_TYPE_PROMPTS = {
  "olive-oil": "For olive oil bottles: The bottles should be filled with golden-yellow olive oil, with dark green or clear glass that allows the oil's color to show through subtly. Each bottle should have an appropriate cap and a label with a classic, elegant design featuring the brand name in bold, sophisticated typography at the top. Include appropriate product details on the label such as 'Extra Virgin Olive Oil' in an elegant font, and add smaller text for volume (e.g., '500 mL') and origin information in a clean, legible font. Position bottles with one slightly in front of the other to create depth, and ensure subtle reflections on the glass to highlight quality and clarity.",

  "fruits": "For fruits: Create a watercolor-style illustration of the fruit with soft brushstrokes and artistic rendering. Use a light yellow gradient background that complements the fruit's natural colors. Capture the vibrant, fresh appearance with gentle, flowing brush strokes that give an artistic impression of texture and form. For bananas, showcase their distinctive curved shape and yellow color with subtle green hints at the stems and tips. For berries or smaller fruits, arrange them in an aesthetically pleasing cluster with organic spacing. Include subtle artistic details like delicate water droplets or a gentle shadow to enhance the visual appeal. Maintain a soft, dreamy quality throughout with slightly blended edges typical of watercolor medium. Keep the composition clean and centered with the fruit as the main focal point against the complementary background.",

  "cosmetics": "For cosmetic products: Display the product with elegant, clean presentation emphasizing the premium quality. Capture the texture and finish of the product container - whether glossy, matte, or metallic. Show any distinctive design elements of the packaging clearly. For bottles with product visible inside, ensure the consistency and color are accurately represented. Position the label to be clearly readable with branding prominently displayed. For sets of products, arrange them in a visually pleasing composition that shows the relationship between items.",

  "electronics": "For electronic products: Showcase the sleek design with attention to the product's distinctive features and interface elements. Highlight the material quality and finish - whether matte, glossy, metallic or textured. Ensure any screens display appropriate content that demonstrates the product's function. Capture details of important ports, buttons, and design elements from the optimal angle. For devices with lighting elements, show them powered on where appropriate. Position multiple components to demonstrate how they work together in a system."
}

// Helper function to get product template by style
export async function getProductTemplate(style: StyleTemplateType): Promise<any> {
  return PRODUCT_TEMPLATES[style] || null;
}

// Helper function to get product type prompt
export async function getProductTypePrompt(type: string): Promise<string> {
  return PRODUCT_TYPE_PROMPTS[type as keyof typeof PRODUCT_TYPE_PROMPTS] || "";
}

// Helper function to generate detailed prompts using template variables - moved from client component
function generateDetailedPrompt(baseTemplate: string, variables: Record<string, string>): string {
  let result = baseTemplate;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value);
  }
  return result;
}

// Function to combine user input with template structure - moved from client component
function enhancePromptWithDetailedTemplate(
  userPrompt: string,
  productType: string,
  detailedTemplateKey?: string
): string {
  // If we have a detailed template and product variables to use
  const templateKey = detailedTemplateKey || "fruits-detailed"; // Default to fruits template
  const template = DETAILED_PRODUCT_TEMPLATES[templateKey as keyof typeof DETAILED_PRODUCT_TEMPLATES];

  if (!template) {
    return userPrompt; // Return original if no template found
  }

  // Extract product name from user prompt for better customization
  let productName = productType;

  // First check if the user prompt contains exact fruit names - improved version
  // Using word boundaries and making detection more reliable
  if (userPrompt.match(/\bbanana(s)?\b/i)) {
    productName = "bananas";
    console.log("Product detected in prompt: bananas");
  } else if (userPrompt.match(/\bapple(s)?\b/i)) {
    productName = "apples";
    console.log("Product detected in prompt: apples");
  } else if (userPrompt.match(/\bstrawberr(y|ies)\b/i)) {
    productName = "strawberries";
    console.log("Product detected in prompt: strawberries");
  } else if (userPrompt.match(/\bolive(-|\s)?oil\b/i) || userPrompt.match(/\boil bottle(s)?\b/i)) {
    productName = "olive-oil";
    console.log("Product detected in prompt: olive oil");
  } else if (userPrompt.match(/\b(cashew|nut(s)?)\b/i)) {
    productName = "nuts";
    console.log("Product detected in prompt: nuts");
  } else if (userPrompt.match(/\b(\d+g|\d+ g)\b/i)) {
    // If we see weight measurements like 250g, assume it's packaged
    productName = "packaged-food";
    console.log("Product detected in prompt: packaged food with weight");
  } else {
    // Fallback to the broader regex match only if specific detection fails
    const userProductMatch = userPrompt.match(/\b(apple|banana|strawberr|blueberr|raspberr|cream|serum|phone|laptop|nut|cashew|packaged|olive|bottle|oil)\w*/i);
    if (userProductMatch) {
      const detectedProduct = userProductMatch[0].toLowerCase();
      console.log("Product detected via fallback regex:", detectedProduct);

      // Map the detected product to the correct template variable key
      if (detectedProduct.includes("banana")) {
        productName = "bananas";
      } else if (detectedProduct.includes("apple")) {
        productName = "apples";
      } else if (detectedProduct.includes("strawberr")) {
        productName = "strawberries";
      } else if (detectedProduct.includes("nut") || detectedProduct.includes("cashew")) {
        productName = "nuts";
      } else if (detectedProduct.includes("packaged")) {
        productName = "packaged-food";
      } else if (detectedProduct.includes("cream") || detectedProduct.includes("serum")) {
        productName = "face-cream";
      } else if (detectedProduct.includes("olive") || detectedProduct.includes("oil") || detectedProduct.includes("bottle")) {
        productName = "olive-oil";
        console.log("Product detected via context (bottle/oil): olive oil");
      }
    } else if (userPrompt.includes("package") || userPrompt.includes("packed") || userPrompt.includes("box")) {
      productName = "packaged-food";
      console.log("Product detected via context: packaged food");
    } else if (userPrompt.includes("cream") || userPrompt.includes("serum") || userPrompt.includes("skincare")) {
      productName = "face-cream";
      console.log("Product detected via context: face cream");
    } else if (userPrompt.includes("bottle") || userPrompt.includes("oil")) {
      productName = "olive-oil";
      console.log("Product detected via context: olive oil");
    }
  }

  console.log(`Using template variables for: ${productName}`);

  // Get variables for this product type or use defaults
  const variables = TEMPLATE_VARIABLES[productName as keyof typeof TEMPLATE_VARIABLES] ||
    TEMPLATE_VARIABLES["strawberries"]; // Default to strawberries

  // Generate the template with proper variables
  const detailedTemplate = generateDetailedPrompt(template.basePrompt, variables);

  // Combine user prompt with template
  return `${userPrompt}. ${detailedTemplate}`;
}

interface GenerateImageParams {
  prompt: string
  negativePrompt?: string
  aspectRatio: string
  mode?: string
  templateStyle?: StyleTemplateType
  productType?: string
  useDetailedTemplate?: boolean // New flag to use detailed template system
}

// New interface for image-to-image generation
interface ImageToImageParams {
  prompt: string
  sourceImageBase64: string
  negativePrompt?: string
  mode?: string
  templateStyle?: StyleTemplateType
  productType?: string
  useDetailedTemplate?: boolean // New flag to use detailed template system
}

// Helper function to enhance user prompt with template and product-specific details
function enhancePromptWithTemplate(
  userPrompt: string,
  templateStyle?: StyleTemplateType,
  productType?: string,
  useDetailedTemplate?: boolean,
  isImageToImage: boolean = false // New parameter to indicate image-to-image mode
): string {
  let enhancedPrompt = userPrompt;

  // For image-to-image, we want to apply only style templates and not product-specific details
  if (isImageToImage) {
    // Add only style template prompt if provided
    if (templateStyle && PRODUCT_TEMPLATES[templateStyle]) {
      enhancedPrompt = `${enhancedPrompt}. Apply the following style to the image: ${PRODUCT_TEMPLATES[templateStyle].prompt}`;
    }
    // Add stronger instruction to preserve the main subject of the uploaded image
    enhancedPrompt = `${enhancedPrompt}. Maintain the main subject and composition of the source image while applying the requested style transformation. Focus on transforming the visual style and lighting, not replacing the subject.`;
    return enhancedPrompt;
  }

  // Original logic for text-to-image
  // If the detailed template flag is set and we have product type
  if (useDetailedTemplate && productType) {
    // Use the new detailed template system based on strawberry success
    const detailedTemplateKey =
      productType.includes("cosmetic") ? "cosmetics-detailed" :
        productType.includes("electron") ? "electronics-detailed" :
          "fruits-detailed";
    return enhancePromptWithDetailedTemplate(userPrompt, productType, detailedTemplateKey);
  }

  // Otherwise, use the standard template system
  // Add style template prompt if provided
  if (templateStyle && PRODUCT_TEMPLATES[templateStyle]) {
    enhancedPrompt = `${enhancedPrompt}. ${PRODUCT_TEMPLATES[templateStyle].prompt}`;
  }

  // Add product-specific details if provided
  if (productType && PRODUCT_TYPE_PROMPTS[productType as keyof typeof PRODUCT_TYPE_PROMPTS]) {
    enhancedPrompt = `${enhancedPrompt}. ${PRODUCT_TYPE_PROMPTS[productType as keyof typeof PRODUCT_TYPE_PROMPTS]}`;
  }

  return enhancedPrompt;
}

export async function generateImageFromText({
  prompt,
  negativePrompt = "",
  aspectRatio,
  mode = "Photorealistic",
  templateStyle,
  productType,
  useDetailedTemplate = true, // Default to using the detailed template system
}: GenerateImageParams): Promise<string> {
  try {
    // Enhance prompt with template and product type if provided
    const enhancedPrompt = enhancePromptWithTemplate(
      prompt,
      templateStyle,
      productType,
      useDetailedTemplate
    );

    // Prepare the prompt with negative prompts if provided
    let fullPrompt = negativePrompt ? `${enhancedPrompt}\nNegative: ${negativePrompt}` : enhancedPrompt

    // Add mode and aspect ratio information to the prompt
    fullPrompt = mode && mode !== 'Photorealistic'
      ? `${fullPrompt}\nStyle: ${mode}`
      : fullPrompt

    // Force 1:1 aspect ratio for professional product images and add system prompt
    const finalAspectRatio = "1:1" // Always use 1:1 aspect ratio for product images
    const finalPrompt = `${PRODUCT_IMAGE_SYSTEM_PROMPT}\n\n${fullPrompt}\nAspect ratio: ${finalAspectRatio}\nNo text overlay. Professional macro/close-up shot.`

    console.log("Generating with enhanced prompt:", finalPrompt.substring(0, 100) + "...")

    // Generate the image using the official API format
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp-image-generation',
      contents: finalPrompt,
      config: {
        responseModalities: ['Text', 'Image']
      },
    });

    // Check if there's an image in the response
    const parts = response.candidates?.[0]?.content?.parts || []

    // Check for policy violation text responses
    const textPart = parts.find(part => part.text)
    if (textPart && textPart.text && textPart.text.includes("violates the policy")) {
      throw new Error(`Content policy violation: ${textPart.text.split('\n')[0]}`)
    }

    const imagePart = parts.find((part) => part.inlineData?.mimeType?.startsWith("image/"))
    if (!imagePart || !imagePart.inlineData) {
      throw new Error("No image was generated in the response")
    }
    if (!imagePart.inlineData.data) {
      throw new Error("Image data is missing in the response")
    }

    // Return the base64 image data
    return imagePart.inlineData.data
  } catch (error: any) {
    // Log the underlying cause if available (useful for fetch errors)
    if (error.cause) {
      console.error("Underlying cause:", error.cause)
    }

    // Use the formatErrorMessage helper function for consistent error messages
    throw new Error(formatErrorMessage(error))
  }
}

// Helper function for delay - add this before the generateImageFromImage function
async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to implement retry logic with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  { retries = 3, initialDelay = 1000, maxDelay = 10000 }: { retries?: number; initialDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  let lastError: any;
  let delayTime = initialDelay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      if (attempt > 0) {
        console.log(`Retry attempt ${attempt} of ${retries} after ${delayTime}ms delay`);
      }
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Only retry on 503 errors or service unavailability
      const isRetryableError =
        error.message?.includes("503") ||
        error.message?.includes("Service Unavailable") ||
        error.message?.includes("overloaded");

      // Don't retry if it's not a retryable error or if we've used all retries
      if (!isRetryableError || attempt === retries) {
        throw error;
      }

      // Exponential backoff with jitter
      await delay(delayTime + Math.floor(Math.random() * 500));

      // Increase delay for next retry (exponential backoff), but cap at maxDelay
      delayTime = Math.min(delayTime * 2, maxDelay);
    }
  }

  throw lastError;
}

export async function generateImageFromImage({
  prompt,
  sourceImageBase64,
  negativePrompt = "",
  mode = "Photorealistic",
  templateStyle,
  productType,
  useDetailedTemplate = true, // Default to using the detailed template system
}: ImageToImageParams): Promise<string> {
  // Function to perform the actual image generation (extracted for retry logic)
  const performGeneration = async (): Promise<string> => {
    try {
      // Validate the input image base64 data
      if (!sourceImageBase64 || sourceImageBase64.trim() === "") {
        throw new Error("Source image data is missing")
      }
      console.log("Processing image-to-image with source image length:", sourceImageBase64.length)
      // Enhance prompt with template if provided
      const enhancedPrompt = enhancePromptWithTemplate(
        prompt,
        templateStyle,
        productType,
        useDetailedTemplate,
        true // Indicate image-to-image mode
      );
      // Prepare the prompt with negative prompts if provided
      let fullPrompt = negativePrompt ? `${enhancedPrompt}\nNegative: ${negativePrompt}` : enhancedPrompt
      // Add mode information to the prompt
      fullPrompt = mode && mode !== 'Photorealistic'
        ? `${fullPrompt}\nStyle: ${mode}`
        : fullPrompt
      // Add system prompt
      fullPrompt = `${PRODUCT_IMAGE_SYSTEM_PROMPT}\n\n${fullPrompt}\nModify the source image as described. No text overlay. Professional.`
      console.log("Generating with enhanced prompt:", fullPrompt.substring(0, 100) + "...")
      // Prepare the content with both text and image
      const content = [
        { text: fullPrompt },
        {
          inlineData: {
            mimeType: "image/png",
            data: sourceImageBase64
          }
        }
      ];
      console.log("Sending request to AI model")
      // Generate the image using the official API format
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash-exp-image-generation',
        contents: content,
        config: {
          responseModalities: ['Text', 'Image']
        },
      });
      console.log("Received response from AI model")
      // Check if there's an image in the response
      const parts = response.candidates?.[0]?.content?.parts || []
      // Check for policy violation text responses
      const textPart = parts.find(part => part.text)
      if (textPart && textPart.text && textPart.text.includes("violates the policy")) {
        throw new Error(`Content policy violation: ${textPart.text.split('\n')[0]}`)
      }
      const imagePart = parts.find((part) => part.inlineData?.mimeType?.startsWith("image/"))
      if (!imagePart || !imagePart.inlineData) {
        throw new Error("No image was generated in the response")
      }
      if (!imagePart.inlineData.data) {
        throw new Error("Image data is missing in the response")
      }
      console.log("Successfully generated image from source image")
      // Return the base64 image data
      return imagePart.inlineData.data
    } catch (error: any) {
      // Log the underlying cause if available (useful for fetch errors)
      if (error.cause) {
        console.error("Underlying cause:", error.cause)
      }

      // Use the formatErrorMessage helper function for consistent error messages
      throw new Error(formatErrorMessage(error))
    }
  };

  // Use retry logic for the image generation
  return withRetry(performGeneration);
}

export interface ChatMessage {
  role: string
  content: string
  imageData?: string
}

interface EditImageParams {
  message: string
  chatHistory?: string[]
  imageBase64?: string
  templateStyle?: StyleTemplateType
  productType?: string
  useDetailedTemplate?: boolean // New flag to use detailed template system
}

let chatSession: any = null;

export async function editImageWithChat({
  message,
  chatHistory,
  imageBase64,
  templateStyle,
  productType,
  useDetailedTemplate = true, // Default to using the detailed template system
}: EditImageParams): Promise<ChatMessage> {
  try {
    // Enhanced message with template and product type if provided
    const enhancedMessage = enhancePromptWithTemplate(
      message,
      templateStyle,
      productType,
      useDetailedTemplate
    );

    // Initialize chat session if it doesn't exist
    if (!chatSession) {
      // Create a chat session with response modalities for both text and image
      chatSession = {
        sendMessage: async (content: any) => {
          // Add the system prompt to the content if it's text-only
          let enhancedContent = content;

          if (typeof content === 'object' && content.text) {
            // For simple text requests
            enhancedContent = {
              text: `${PRODUCT_IMAGE_SYSTEM_PROMPT}\n\n${content.text}\nGenerate a 1:1 aspect ratio image. No text overlay. Professional macro/close-up shot.`
            };
          } else if (Array.isArray(content)) {
            // For messages with images
            const textContent = content.find(item => item.text);
            if (textContent) {
              textContent.text = `${PRODUCT_IMAGE_SYSTEM_PROMPT}\n\n${textContent.text}\nGenerate a 1:1 aspect ratio image. No text overlay. Professional macro/close-up shot.`;
            }
            enhancedContent = content;
          }

          return await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp-image-generation',
            contents: enhancedContent,
            config: {
              responseModalities: ['Text', 'Image']
            }
          });
        }
      };
    }

    // Prepare the chat message content
    let messageContent: any = { text: enhancedMessage };

    // If there's an image to edit, include it in the content
    if (imageBase64) {
      messageContent = [
        { text: enhancedMessage },
        {
          inlineData: {
            mimeType: "image/png",
            data: imageBase64
          }
        }
      ];
    }

    // Send the message to the chat session
    const result = await chatSession.sendMessage(messageContent);

    // Process the response - improved handling of response structure
    let responseParts = [];

    // Check if we have a response in the expected format (for custom sendMessage wrapper)
    if (result.response?.parts) {
      responseParts = result.response.parts;
    }
    // Check for candidates format (direct API response format)
    else if (result.candidates && result.candidates[0]?.content?.parts) {
      responseParts = result.candidates[0].content.parts;
    }

    // Check for policy violation text responses
    const textPart = responseParts.find((part: any) => part.text);
    if (textPart && textPart.text && textPart.text.includes("violates the policy")) {
      throw new Error(`Content policy violation: ${textPart.text.split('\n')[0]}`)
    }

    // Extract the image part if it exists
    const imagePart = responseParts.find((part: any) =>
      part.inlineData?.mimeType?.startsWith("image/")
    );

    // Create the response message with better fallback text
    const responseMessage: ChatMessage = {
      role: 'model',
      content: textPart?.text || (imagePart ? "Image generated successfully." : "No response received from AI. Please try again."),
    };

    // Add image data if available
    if (imagePart?.inlineData?.data) {
      responseMessage.imageData = imagePart.inlineData.data;
    }

    return responseMessage;
  } catch (error: any) {
    // Log the underlying cause if available (useful for fetch errors)
    if (error.cause) {
      console.error("Underlying cause:", error.cause);
    }

    // Provide more user-friendly error message for content policy violations
    const errorMessage = error.message || String(error);
    if (errorMessage.includes("Content policy violation")) {
      throw new Error(errorMessage);
    }

    throw new Error(`Failed to edit image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper function to check for location-based restriction errors
function isLocationRestrictionError(error: any): boolean {
  const errorMessage = error.message || String(error);
  return (
    errorMessage.includes("User location is not supported") ||
    errorMessage.includes("FAILED_PRECONDITION") ||
    (errorMessage.includes("location") && errorMessage.includes("not supported")) ||
    errorMessage.includes("regional availability") ||
    errorMessage.includes("regional restrictions") ||
    errorMessage.includes("unavailable in your region") ||
    errorMessage.includes("geographic region") ||
    errorMessage.includes("country") ||
    errorMessage.includes("territory") ||
    (errorMessage.includes("403") && errorMessage.includes("access denied")) ||
    (errorMessage.includes("blocked") && errorMessage.includes("region")) ||
    (errorMessage.includes("not available") && (
      errorMessage.includes("country") ||
      errorMessage.includes("region") ||
      errorMessage.includes("location")
    )) ||
    // Additional patterns to catch more location restriction errors
    errorMessage.includes("PERMISSION_DENIED") ||
    errorMessage.includes("geo-restrictions") ||
    (errorMessage.includes("access") && errorMessage.includes("restricted")) ||
    (errorMessage.includes("service") && errorMessage.includes("unavailable in") &&
      (errorMessage.includes("country") || errorMessage.includes("region"))) ||
    errorMessage.includes("not allowed to access from your location")
  );
}

// Helper function to format error messages consistently across all functions
function formatErrorMessage(error: any): string {
  // Check for location-based restrictions first
  if (isLocationRestrictionError(error)) {
    return "Image generation is not available in your current geographic region. " +
      "Google's Gemini API has regional restrictions and is not available worldwide. " +
      "You may need to use a VPN to access from a supported region or try an alternative image generation service. " +
      "For more information on supported regions, visit https://ai.google.dev/available_regions";
  }

  // Handle service unavailability errors
  if (error.message?.includes("503") ||
    error.message?.includes("Service Unavailable") ||
    error.message?.includes("overloaded")) {
    return "The image generation service is currently overloaded. " +
      "This is a temporary issue with the Gemini API. " +
      "Please wait a few minutes and try again.";
  }

  // Handle network connection issues
  if (error.cause && error.cause.name === "TypeError" && error.cause.message.includes("fetch")) {
    return "Network connection issue. Please check your internet connection and try again.";
  }

  // Handle content policy violations
  if (error.message?.includes("violates the policy") || error.message?.includes("policy violation")) {
    return "The requested image violated content policies. Please modify your prompt to avoid sensitive content.";
  }

  // Default error message with original error details
  return `Failed to generate image: ${error instanceof Error ? error.message : String(error)}`;
}
