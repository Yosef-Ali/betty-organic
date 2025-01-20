'use client'

import { useToast } from '@/hooks/use-toast'
import { ProductFormValues } from './ProductFormSchema'

export function useProductFormValidation() {
  const { toast } = useToast()

  const validateProduct = (data: ProductFormValues): boolean => {
    if (!data.name || data.name.length < 2) {
      toast({
        title: "Validation Error",
        description: "Product name must be at least 2 characters long",
        variant: "destructive",
      })
      return false
    }

    if (data.price < 0) {
      toast({
        title: "Validation Error",
        description: "Price must be a positive number",
        variant: "destructive",
      })
      return false
    }

    if (data.stock < 0) {
      toast({
        title: "Validation Error",
        description: "Stock must be a non-negative number",
        variant: "destructive",
      })
      return false
    }

    return true
  }

  return { validateProduct }
}
