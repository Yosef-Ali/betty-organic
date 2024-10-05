'use client'

import { uploadImage } from '@/app/actions/productActions'
import { useState } from 'react'
import { experimental_useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = experimental_useFormStatus()

  return (
    <button type="submit" disabled={pending} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300">
      {pending ? 'Uploading...' : 'Upload Image'}
    </button>
  )
}

export function ImageUploader() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  async function handleSubmit(formData: FormData) {
    const additionalParam = 'exampleCategory' // Replace with the actual second argument
    const imageUrl = await uploadImage(formData, additionalParam)
    setImageUrl(imageUrl)
  }
}
