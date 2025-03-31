"use client"
import React, { useState, ChangeEvent, useEffect } from "react"
import { Upload, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ImageUploaderProps {
  className?: string
  onImageUpload: (base64: string) => void
}

export function ImageUploader({ className, onImageUpload }: ImageUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

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
    onImageUpload("")
  }

  return (
    <div className={cn("flex flex-col space-y-4", className)}>
      {!previewUrl ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
          <input
            type="file"
            id="image-upload"
            className="sr-only"
            accept="image/png,image/jpeg,image/gif"
            onChange={handleFileChange}
            disabled={isLoading}
          />
          <label htmlFor="image-upload" className="cursor-pointer text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-1">
              {isLoading ? "Processing image..." : "Click to upload an image"}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">PNG, JPG, GIF up to 5MB</p>
          </label>
        </div>
      ) : (
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={previewUrl}
            alt="Uploaded image"
            className="w-full h-auto object-contain max-h-[200px]"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full"
            onClick={clearImage}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
