import * as z from 'zod'

export const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  price: z.number().min(0, {
    message: "Price must be a positive number.",
  }),
  stock: z.number().int().min(0, {
    message: "Stock must be a non-negative integer.",
  }),
  imageUrl: z.string().optional(),
  status: z.enum(['active', 'out_of_stock']).optional(),
})

export type ProductFormValues = z.infer<typeof formSchema>
