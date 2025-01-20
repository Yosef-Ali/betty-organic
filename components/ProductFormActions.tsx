'use client'

import { Button } from "@/components/ui/button"
import { ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { UseFormReturn } from 'react-hook-form'
import { ProductFormValues } from './ProductFormSchema'

interface ProductFormActionsProps {
  form: UseFormReturn<ProductFormValues>
  isLoading: boolean
  initialData?: ProductFormValues & { id: string }
  stock: number
}

export function ProductFormActions({
  form,
  isLoading,
  initialData,
  stock
}: ProductFormActionsProps) {
  const router = useRouter()

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-xl font-semibold">
          {initialData ? 'Edit Product' : 'Add Product'}
        </h1>
        <div className="hidden md:flex items-center gap-2 ml-auto">
          <Button type="button" variant="outline" size="sm" onClick={() => form.reset()}>
            Discard
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? 'Saving...' : initialData ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      </div>

      {/* Mobile Actions */}
      <div className="flex items-center justify-center gap-2 mt-6 md:hidden">
        <Button type="button" variant="outline" size="sm" onClick={() => form.reset()}>
          Discard
        </Button>
        <Button type="submit" size="sm" disabled={isLoading}>
          {isLoading ? 'Saving...' : initialData ? 'Update Product' : 'Save Product'}
        </Button>
      </div>
    </>
  )
}
