"use client"
import React, { useState, ChangeEvent, useEffect } from "react"
import { Upload, XCircle, Image as ImageIcon, CheckCircle, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  className?: string
  onImageUpload: (base64: string) => void
}

export function ImageUploader({ className, onImageUpload }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [imageInfo, setImageInfo] = useState<{ size: string; type: string } | null>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5MB.")
      return
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      alert("Only image files are allowed.")
      return
    }

    setIsLoading(true)

    // Set image info
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2)
    setImageInfo({
      size: `${sizeInMB}MB`,
      type: file.type.split('/')[1].toUpperCase()
    })

    const reader = new FileReader()
    reader.onload = (event) => {
      const base64String = event.target?.result as string
      // Extract the base64 data (remove the data URL prefix)
      const base64Data = base64String.split(',')[1]
      setPreviewUrl(base64String)
      onImageUpload(base64Data)
      setIsLoading(false)
    }

    reader.onerror = () => {
      alert("Failed to read the image file. Please try again.")
      setIsLoading(false)
    }

    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setPreviewUrl(null)
    setImageInfo(null)
    onImageUpload("")
  }

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      {!previewUrl ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 transition-all hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer group">
          <input
            type="file"
            id="image-upload"
            className="sr-only"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <label htmlFor="image-upload" className="cursor-pointer text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                {isLoading ? (
                  <Upload className="h-8 w-8 text-gray-600 dark:text-gray-400 animate-pulse" />
                ) : (
                  <Upload className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                )}
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {isLoading ? "Processing your image..." : "Upload Product Image"}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-3">
              Drag & drop or click to select your product image
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                PNG, JPG, GIF, WebP
              </span>
              <span>•</span>
              <span>Max 5MB</span>
              <span>•</span>
              <span className="text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                AI Ready
              </span>
            </div>
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={previewUrl}
              alt="Source image for transformation"
              className="w-full h-auto object-contain max-h-[250px] bg-gray-50 dark:bg-gray-900"
            />
            <div className="absolute top-3 left-3">
              <Badge className="bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Ready
              </Badge>
            </div>
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg"
              onClick={clearImage}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
          {imageInfo && (
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {imageInfo.type}
                </span>
                <span>{imageInfo.size}</span>
              </div>
              <Badge variant="outline" className="text-xs border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                AI Enhanced
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
