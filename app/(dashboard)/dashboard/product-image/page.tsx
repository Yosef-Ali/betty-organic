"use client"
import { useState } from "react"
import Image from "next/image";
import { Download, ImageIcon, Loader2, MessageSquare, ArrowLeft, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

import { generateImageFromText, generateImageFromImage, editImageWithChat } from "@/app/actions/productImage"

import { StyleTemplateSelector, StyleTemplateType, PRODUCT_TEMPLATES } from "@/components/style-template-selector"
import { ImageUploader } from "@/components/dashboard/image-uploader"
import { ImageEditChat } from "@/components/dashboard/chat"
import { useToast } from "@/components/ui/use-toast"

export default function TextToImageGenerator() {
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("1:1")
  const [mode, setMode] = useState("Photorealistic")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [sourceImageBase64, setSourceImageBase64] = useState<string>("")
  const [activeTab, setActiveTab] = useState("text-to-image")
  const [templateStyle, setTemplateStyle] = useState<StyleTemplateType>("classic-product")
  const [productType, setProductType] = useState<string>("olive-oil")

  // Handle tab switching to reset any state as needed
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Clear generated image when switching tabs
    // setGeneratedImage(null)
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt required",
        description: "Please enter a text prompt to generate an image.",
        variant: "destructive",
      })
      return
    }
    setIsGenerating(true)
    setGeneratedImage(null)
    setShowChat(false)
    try {
      let imageData;
      // Depending on active tab, use different generation method
      if (activeTab === "image-to-image") {
        if (!sourceImageBase64) {
          throw new Error("Please upload an image first")
        }
        console.log("Using image-to-image with source image")
        imageData = await generateImageFromImage({
          prompt,
          sourceImageBase64,
          negativePrompt,
          mode,
          templateStyle,
          productType,
        })
      } else {
        // Default text-to-image generation
        imageData = await generateImageFromText({
          prompt,
          negativePrompt,
          aspectRatio,
          mode,
          templateStyle,
          productType,
        })
      }
      setGeneratedImage(`data:image/png;base64,${imageData}`)
    } catch (error: any) {
      console.error("Error generating image:", error)
      toast({
        title: "Generation failed",
        description: error.message || "There was an error generating your image. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return
    const link = document.createElement("a")
    link.href = generatedImage
    link.download = `gemini-product-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleEditComplete = (imageBase64: string) => {
    setGeneratedImage(`data:image/png;base64,${imageBase64}`)
  }

  const toggleChat = () => {
    setShowChat(!showChat)
  }

  const handleEditWithChat = () => {
    if (!generatedImage) return
    toggleChat()
  }

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Product Image Generator</h1>
        <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
          Create consistent, professional product images using Google&apos;s Gemini models
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={showChat && generatedImage ? "hidden lg:block" : ""}>
          <CardContent className="p-6 space-y-4">
            <Tabs
              defaultValue="text-to-image"
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="text-to-image">Text to Image</TabsTrigger>
                <TabsTrigger value="image-to-image">Image to Image</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              <TabsContent value="text-to-image" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt">Text Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the product you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                    <span className="text-sm text-gray-500">{aspectRatio}</span>
                  </div>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger id="aspect-ratio">
                      <SelectValue placeholder="Select aspect ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1:1">Square (1:1)</SelectItem>
                      <SelectItem value="4:3">Standard (4:3)</SelectItem>
                      <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                      <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                      <SelectItem value="3:4">Portrait (3:4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="image-to-image" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Source Image</Label>
                  <ImageUploader onImageUpload={setSourceImageBase64} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prompt-img2img">Text Prompt</Label>
                  <Textarea
                    id="prompt-img2img"
                    placeholder="Describe how to modify the image..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
              </TabsContent>
              <TabsContent value="advanced" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt-advanced">Text Prompt</Label>
                  <Textarea
                    id="prompt-advanced"
                    placeholder="Describe the product you want to generate..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="negative-prompt">Negative Prompt</Label>
                  <Textarea
                    id="negative-prompt"
                    placeholder="Elements you want to exclude from the image..."
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Product Type Selector */}
            <div className="space-y-2">
              <Label htmlFor="product-type">Product Type</Label>
              <Select value={productType} onValueChange={setProductType}>
                <SelectTrigger id="product-type">
                  <SelectValue placeholder="Select product type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="olive-oil">Olive Oil</SelectItem>
                  <SelectItem value="fruits">Fruits / Produce</SelectItem>
                  <SelectItem value="cosmetics">Cosmetics / Beauty</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose the type of product to generate optimized images with appropriate styling
              </p>
            </div>

            {/* Style Template Selector */}
            <div className="space-y-2">
              <Label htmlFor="product-template">Product Image Style</Label>
              <StyleTemplateSelector
                value={templateStyle}
                onStyleChange={setTemplateStyle}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Selected style: <span className="font-medium">{PRODUCT_TEMPLATES[templateStyle].name}</span> - {PRODUCT_TEMPLATES[templateStyle].description}
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="mode">Rendering Style</Label>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger id="mode">
                    <SelectValue placeholder="Select style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Photorealistic">Photorealistic</SelectItem>
                    <SelectItem value="Cinematic">Cinematic</SelectItem>
                    <SelectItem value="Digital Art">Digital Art</SelectItem>
                    <SelectItem value="3D Render">3D Render</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating || (activeTab === "image-to-image" && !sourceImageBase64)}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : activeTab === "image-to-image" ? (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Transform Product
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 mr-2" />
                    Generate Product Image
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <CardContent className="p-0 relative h-full flex flex-col">
            {showChat && generatedImage ? (
              <>
                <div className="p-4 border-b flex items-center">
                  <Button variant="ghost" size="icon" onClick={toggleChat} className="mr-2">
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-lg font-medium">Edit Image with Chat</h3>
                </div>
                <div className="flex-1">
                  <ImageEditChat
                    initialImage={generatedImage}
                    onEditComplete={handleEditComplete}
                    className="h-full"
                    templateStyle={templateStyle}
                    productType={productType}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 aspect-square md:aspect-auto md:h-full min-h-[400px]">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <Loader2 className="w-10 h-10 mb-4 animate-spin text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">Generating your product image...</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">This may take a moment</p>
                  </div>
                ) : generatedImage ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={generatedImage}
                      alt="Generated product image"
                      width={500} height={500} className="object-contain w-full h-full"
                    />
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                      <Button
                        variant="secondary"
                        className="flex items-center gap-2"
                        onClick={toggleChat}
                      >
                        <MessageSquare className="w-4 h-4" />
                        Edit with Chat
                      </Button>
                      <Button
                        variant="secondary"
                        className="flex items-center gap-2"
                        onClick={handleDownload}
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <ImageIcon className="w-10 h-10 mb-4 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">Your product image will appear here</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                      {activeTab === "image-to-image"
                        ? "Upload a product image and add a prompt to transform it"
                        : "Enter a prompt and click Generate"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
