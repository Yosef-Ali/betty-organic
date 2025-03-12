import * as z from 'zod'
import { ProductCategory } from '@/types/supabase'

const PRODUCT_CATEGORIES: ProductCategory[] = [
  "All",
  "Spices_Oil_Tuna",
  "Flowers",
  "Vegetables",
  "Fruits",
  "Herbs_Lettuce",
  "Dry_Stocks_Bakery",
  "Eggs_Dairy_products"
]

export const productFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  price: z.number()
    .refine(val => !isNaN(val), {
      message: "Price must be a valid number",
    })
    .refine(val => val >= 0, {
      message: "Price must be a positive number",
    }),
  stock: z.number()
    .int()
    .refine(val => !isNaN(val), {
      message: "Stock must be a valid number",
    })
    .refine(val => val >= 0, {
      message: "Stock must be a non-negative integer",
    }),
  imageUrl: z.string().optional(),
  status: z.enum(['active', 'out_of_stock']).default('active'),
  category: z.enum([
    "All",
    "Spices_Oil_Tuna",
    "Flowers",
    "Vegetables",
    "Fruits",
    "Herbs_Lettuce",
    "Dry_Stocks_Bakery",
    "Eggs_Dairy_products"
  ] as const).default('All'),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export interface ImageUploadResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}
