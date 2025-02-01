import * as z from 'zod';

export const testimonialFormSchema = z.object({
  customerName: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.string().optional(),
  content: z.string().min(10, 'Testimonial must be at least 10 characters'),
  rating: z.number().min(1).max(5).optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;
