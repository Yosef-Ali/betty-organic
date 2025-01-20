import { Suspense } from 'react'
import { ProductForm } from '@/components/ProductForm'
import { getProduct } from '@/app/actions/productActions'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface Props {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params)
  return {
    title: `Edit Product ${resolvedParams.id}`
  }
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
}

export default async function EditProductPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params)
  const product = await getProduct(resolvedParams.id)

  if (!product) {
    notFound()
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <ProductForm initialData={product} />
      </div>
    </Suspense>
  )
}
