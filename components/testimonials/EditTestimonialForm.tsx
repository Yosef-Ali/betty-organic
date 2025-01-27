'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  createTestimonial,
  updateTestimonial,
} from '@/app/actions/testimonialActions';
import {
  TestimonialFormValues,
  testimonialFormSchema,
} from './TestimonialFormSchema';
import { TestimonialDetailsForm } from './TestimonialDetailsForm';
import { AvatarUpload } from '@/components/ui/avatar-upload';
import { StarRating } from './StarRating';
import { Testimonial } from '@/lib/types/supabase';

interface EditTestimonialFormProps {
  initialData?: Testimonial;
}

export function EditTestimonialForm({ initialData }: EditTestimonialFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(testimonialFormSchema),
    defaultValues: initialData
      ? {
          name: initialData.author,
          role: initialData.role,
          content: initialData.content,
          status: initialData.approved ? 'active' : 'inactive',
          image_url: initialData.image_url || '',
          rating: initialData.rating,
        }
      : {
          name: '',
          role: '',
          content: '',
          status: 'active',
          image_url: '',
          rating: 5,
        },
  });

  const onSubmit = async (data: TestimonialFormValues) => {
    if (isLoading) return;

    try {
      setIsLoading(true);

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      if (initialData?.id) {
        await updateTestimonial(initialData.id, formData);
        toast({
          title: 'Success',
          description: 'Testimonial updated successfully',
        });
      } else {
        await createTestimonial(formData);
        toast({
          title: 'Success',
          description: 'Testimonial created successfully',
        });
      }

      router.push('/dashboard/settings/testimonials');
      router.refresh();
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {initialData ? 'Edit Testimonial' : 'Add Testimonial'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {initialData
                ? 'Update the testimonial details'
                : 'Add a new customer testimonial'}
            </p>
          </div>
        </div>

        <div className="grid gap-8">
          <div className="flex gap-8">
            <div className="flex-1">
              <TestimonialDetailsForm form={form} />
            </div>
            <div className="w-72 space-y-8">
              <AvatarUpload
                form={form}
                name="image_url"
                label="Profile Picture"
                bucketName="testimonials"
                entityId={initialData?.id}
                size="lg"
              />
              <StarRating form={form} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : initialData
              ? 'Update Testimonial'
              : 'Create Testimonial'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
