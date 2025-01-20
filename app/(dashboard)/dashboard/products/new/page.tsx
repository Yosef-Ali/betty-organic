import { Suspense } from 'react'
import { ProductForm } from "@/components/ProductForm"
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Add New Product",
  description: "Create a new product"
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default function AddProductPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <ProductForm />
      </div>
    </Suspense>
  )
}
