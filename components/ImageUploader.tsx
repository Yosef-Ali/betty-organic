'use client'

import { uploadTestimonialImage } from '@/app/actions/upload-image'
import { useState } from 'react'
import { experimental_useFormStatus as useFormStatus } from 'react-dom'
import Image from 'next/image'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full py-2 px-4 rounded ${pending ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'} text-white transition-colors`}
    >
      {pending ? 'Uploading...' : 'Upload Image'}
    </button>
  )
}

interface ImageUploaderProps {
  initialImageUrl?: string
  onImageChange?: (url: string | null) => void
}

export function ImageUploader({ initialImageUrl, onImageChange }: ImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl || null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Cleanup previous preview URL if exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      const objectUrl = URL.createObjectURL(file)
      setPreviewUrl(objectUrl)
      setError(null)
      setMessage(null)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl(null)
    setPreviewUrl(null)
    setError(null)
    setMessage(null)
    onImageChange?.(null)
  }

  async function handleSubmit(formData: FormData) {
    try {
      const result = await uploadTestimonialImage(formData)
      if (result.success) {
        setImageUrl(result.imageUrl)
        setMessage('Upload successful!')
        setError(null)
        onImageChange?.(result.imageUrl)
        // Cleanup preview URL after successful upload
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
          setPreviewUrl(null)
        }
      } else {
        throw new Error('Upload failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setMessage(null)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <form action={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full"
          />

          {(previewUrl || imageUrl) && (
            <div className="mt-4 relative aspect-square w-full overflow-hidden rounded-lg">
              <Image
                src={previewUrl || imageUrl || ''}
                alt="Preview"
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                aria-label="Remove image"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <SubmitButton />

        {error && (
          <p className="text-red-500">{error}</p>
        )}

        {message && (
          <p className="text-green-500">{message}</p>
        )}
      </form>
    </div>
  )
}
