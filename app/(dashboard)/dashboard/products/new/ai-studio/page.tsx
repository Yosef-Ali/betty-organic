"use client"
import { useState, useEffect } from "react"
import Image from "next/image"
import { Download, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { ImageUploader } from "@/components/dashboard/image-uploader"
import { AiStudioSkeleton } from "@/components/skeletons/ai-studio-skeleton"

export default function TextToImageGenerator() {
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [sourceImageBase64, setSourceImageBase64] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate component mounting time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 800)

    return () => clearTimeout(timer)
  }, [])

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

    try {
      const response = await fetch('/api/generate-product-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          style: 'watercolor',
          quality: 'hd',
          size: '1024x1024',
          sourceImage: sourceImageBase64 || undefined,
          mode: sourceImageBase64 ? 'image-to-image' : 'text-to-image'
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.imageUrl.startsWith('data:')) {
        setGeneratedImage(data.imageUrl);
      } else if (data.imageUrl.startsWith('http')) {
        setGeneratedImage(data.imageUrl);
      } else {
        setGeneratedImage(`data:image/png;base64,${data.imageUrl}`);
      }

      toast({
        title: "Image generated successfully!",
        description: "Your professional product image is ready!",
      });
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
    link.download = `product-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return <AiStudioSkeleton />
  }

  return (
    <div className="container max-w-6xl py-6 space-y-8">
      <div className="space-y-6 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-800 rounded-full text-sm font-medium dark:bg-gray-800 dark:text-gray-200">
          <ImageIcon className="h-4 w-4" />
          Advanced AI Studio
        </div>
        <h1 className="text-3xl font-bold tracking-tighter text-gray-900 dark:text-gray-100">
          AI Studio
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Generate professional product images for your new product. Multiple AI models available.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-gray-200 dark:border-gray-700">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Generate Image
                </h2>
                
                <div className="mb-6">
                  <Label className="text-gray-700 dark:text-gray-300 mb-2 block">
                    Upload Reference Image (Optional)
                  </Label>
                  <ImageUploader onImageUpload={setSourceImageBase64} />
                  {sourceImageBase64 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      ✓ Image uploaded - will be used as reference for generation
                    </p>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="prompt" className="text-gray-700 dark:text-gray-300">
                      What do you want to create?
                    </Label>
                    <Textarea
                      id="prompt"
                      placeholder="e.g., 3 fresh organic oranges arranged professionally, artistic painted background, commercial food photography"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px] border-gray-300 dark:border-gray-600"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Bottled Products</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          type="button"
                          onClick={() => setPrompt("Organic olive oil in glass bottle, top view, professional product photography, artistic painted background")}
                          className="text-xs justify-start border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          Olive Oil Bottle
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          type="button"
                          onClick={() => setPrompt("Organic juice in glass bottle, top view, professional product photography, artistic painted background")}
                          className="text-xs justify-start border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          Juice Bottle
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Packaged Products</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          type="button"
                          onClick={() => setPrompt("Organic nuts in paper bag packaging, top view, professional product photography, artistic painted background")}
                          className="text-xs justify-start border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          Paper Bag
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          type="button"
                          onClick={() => setPrompt("Organic grains in plastic bag packaging, top view, professional product photography, artistic painted background")}
                          className="text-xs justify-start border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          Plastic Bag
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Fresh Produce</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          type="button"
                          onClick={() => setPrompt("exactly 3 fresh organic oranges arranged professionally for commercial advertising, perfect product styling, clean vibrant solid background, commercial food photography")}
                          className="text-xs justify-start border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          Fresh Fruits
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          type="button"
                          onClick={() => setPrompt("exactly 3 fresh organic vegetables arranged professionally for commercial advertising, perfect product styling, clean vibrant solid background, commercial food photography")}
                          className="text-xs justify-start border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                        >
                          Fresh Vegetables
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4 mr-2" />
                        Generate Image
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border-gray-200 dark:border-gray-700">
          <CardContent className="p-0 relative h-full flex flex-col">
            <div className="flex items-center justify-center bg-gray-50 dark:bg-gray-900 aspect-square md:aspect-auto md:h-full min-h-[400px]">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Loader2 className="w-8 h-8 mb-4 animate-spin text-gray-600 dark:text-gray-400" />
                  <p className="text-gray-700 dark:text-gray-300">
                    Generating your image...
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Please wait
                  </p>
                </div>
              ) : generatedImage ? (
                <div className="relative w-full h-full">
                  <Image
                    src={generatedImage}
                    alt="Generated product image"
                    width={500} 
                    height={500} 
                    className="object-contain w-full h-full"
                  />
                  <div className="absolute bottom-4 right-4">
                    <Button
                      variant="outline"
                      className="bg-white/90 dark:bg-gray-800/90 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-4 dark:bg-gray-700">
                    <ImageIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h3 className="text-gray-700 dark:text-gray-300 mb-2">
                    Your image will appear here
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Enter a description and click Generate
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}