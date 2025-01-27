import * as z from 'zod';

export const testimonialFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot be longer than 100 characters'),
  role: z
    .string()
    .min(2, 'Role must be at least 2 characters')
    .max(100, 'Role cannot be longer than 100 characters'),
  content: z
    .string()
    .min(10, 'Content must be at least 10 characters')
    .max(1000, 'Content cannot be longer than 1000 characters'),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

export interface ImageUploadResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}
