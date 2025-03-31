"use client"

import * as React from "react"
import Image from "next/image"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Define the product image templates
export const PRODUCT_TEMPLATES = {
  "classic-product": {
    name: "Studio Professional",
    description: "Clean studio photography with professional lighting",
    preview: "/templates/classic-product.png",
    prompt: "Create a high-quality product photograph designed for premium brand marketing. Position the product with professional composition, with subtle depth arrangement where applicable. Use a clean white or light complementary colored background that enhances but doesn't distract from the product. Ensure lighting is soft and even, with subtle highlights to emphasize product features and gentle shadows to add dimension. Include professional reflections appropriate for the product material. Capture all important product details with crystal clarity - textures, materials, and unique features should be visible. For packaged products, the label should be clearly visible with all text legible, properly positioned and professionally presented. The overall composition should be clean, commercial-quality, and visually appealing, with professional color correction that accurately represents the product. No text overlay. Professional macro/close-up shot with 1:1 aspect ratio."
  },
  "artistic-product": {
    name: "Artistic Watercolor",
    description: "Water art style with scenic backgrounds (3 variations)",
    preview: "/templates/artistic-product.png",
    prompt: "Create a set of three artistic watercolor-style product images showing pairs of fruit (two fruits per image) like the red strawberry template with water art backgrounds and yellow accents. Position the pairs of fruit at a medium distance (not close-up) to show them fully in context against beautiful water-inspired artistic backgrounds. For the first image, use a tranquil blue ocean wave background with soft white foam, gentle splashes, and hints of yellow. For the second image, use a serene lake scene with subtle ripple effects, reflections, and a warm yellow glow in the background. For the third image, use flowing watercolor washes in blues, teals, and soft yellow tones to create an abstract water-inspired backdrop. In all three variations, arrange the fruit in pairs, ensure the water elements create depth without overwhelming the product, and incorporate yellow tones as accent colors. The overall style should maintain an artistic watercolor aesthetic with fluid brush strokes and natural color blending. Keep the composition balanced with the paired fruits as the focal point while showcasing the scenic water backgrounds. No text overlay. Provide three distinct variations that highlight different water art backgrounds but maintain consistent paired fruit presentation."
  },
  "lifestyle-product": {
    name: "Lifestyle Context",
    description: "Products shown in natural usage environments",
    preview: "/templates/lifestyle-product.png",
    prompt: "Create a lifestyle product photograph showing the product in its natural usage environment. Position the product as the clear focal point while incorporating contextual elements that suggest how and where the product is used. Use soft, natural lighting with gentle directional qualities that create a warm, inviting atmosphere - like morning sunlight through windows or soft indoor lighting. Apply a shallow depth of field focusing sharply on the product while gently blurring the background to create depth and context without distraction. Use a warm, inviting color palette that complements the product while creating a cohesive mood. Include thoughtfully arranged complementary props that tell a story about the product's purpose and lifestyle association without overwhelming the composition. For food or beverage products, show them in serving contexts that suggest enjoyment. The overall mood should feel authentic, aspirational and relatable, as if capturing a genuine moment in an idealized but believable environment."
  }
}

export type StyleTemplateType = keyof typeof PRODUCT_TEMPLATES

interface StyleTemplateSelectorProps {
  value: StyleTemplateType
  onStyleChange: (value: StyleTemplateType) => void
  className?: string
}

export function StyleTemplateSelector({
  value,
  onStyleChange,
  className,
  ...props
}: StyleTemplateSelectorProps & Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">) {
  return (
    <div className={cn("grid grid-cols-3 gap-4", className)} {...props}>
      {Object.entries(PRODUCT_TEMPLATES).map(([key, template]) => (
        <div
          key={key}
          className={cn(
            "relative flex cursor-pointer flex-col items-center rounded-lg border border-border bg-background p-2 text-center transition-all hover:border-primary",
            value === key && "border-2 border-primary"
          )}
          onClick={() => onStyleChange(key as StyleTemplateType)}
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-md border border-border mb-2">
            {template.preview ? (
              <Image
                src={template.preview}
                alt={template.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
                No Preview
              </div>
            )}
          </div>
          <div className="text-sm font-medium">{template.name}</div>
          <div className="text-xs text-muted-foreground line-clamp-2 h-8">
            {template.description}
          </div>
          {value === key && (
            <div className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
