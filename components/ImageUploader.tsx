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
    const productId = 'some-product-id'; // Replace with actual product ID
    const imageUrl = await uploadImage(formData, productId); // Ensure this line is correct
    setImageUrl(imageUrl);
  }

  return (
    <div className="p-4">
      <form action={handleSubmit} className="mb-4">
        <input type="file" name="file" accept="image/*" className="mb-2" />
        <SubmitButton />
      </form>
      {imageUrl && (
        <div>
          <p>Uploaded Image:</p>
          <img src={imageUrl} alt="Uploaded" className="max-w-sm mt-2" />
        </div>
      )}
    </div>
  )
}
