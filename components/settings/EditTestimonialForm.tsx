'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
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
import { AvatarUpload } from '@/components/avatar-upload';
import { StarRating } from '@/components/testimonials/StarRating';
import { Testimonial } from '@/lib/types/testimonials';

interface TestimonialFormProps {
  initialData?: Testimonial;
  mode?: 'add' | 'edit';
  onSuccess?: () => void;
}

export function TestimonialForm({
  initialData,
  mode = 'add',
  onSuccess,
}: TestimonialFormProps) {
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
          rating: initialData.rating ?? 5,
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
      formData.append('name', data.name);
      formData.append('role', data.role);
      formData.append('content', data.content);
      formData.append('status', data.status);
      formData.append('rating', String(data.rating));
      if (data.image_url) formData.append('image_url', data.image_url);

      if (mode === 'edit' && initialData?.id) {
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

      onSuccess?.();
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
        <div className="grid gap-8">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:flex-1">
              <TestimonialDetailsForm form={form} />
            </div>
            <div className="w-full md:w-72 space-y-8">
              <AvatarUpload
                form={form}
                name="image_url"
                label="Profile Picture"
                bucketName="testimonials"
                entityId={initialData?.id || ''}
                size="lg"
                className="flex flex-col items-center"
                containerClassName="relative group cursor-pointer"
                showOverlay={true}
                overlayContent={
                  <label
                    htmlFor={`avatar-upload-image_url`}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                  >
                    <span className="text-white text-sm">Change Image</span>
                  </label>
                }
                defaultImageUrl={initialData?.image_url || undefined}
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
              : mode === 'edit'
              ? 'Update Testimonial'
              : 'Create Testimonial'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
