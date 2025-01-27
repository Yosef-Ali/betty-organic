'use client';

import { useState } from 'react';
import Image from 'next/image';
import { UseFormReturn } from 'react-hook-form';
import { uploadTestimonialImage } from '@/app/actions/upload-image';
import { Button } from '@/components/ui/button';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  TestimonialFormValues,
  TestimonialData,
} from './TestimonialFormSchema';

interface TestimonialMediaFormProps {
  form: UseFormReturn<TestimonialFormValues>;
  isLoading?: boolean;
  initialData?: TestimonialData;
}

export function TestimonialMediaForm({
  form,
  isLoading,
  initialData,
}: TestimonialMediaFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl || null,
  );
  const { toast } = useToast();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (initialData?.id) {
        formData.append('testimonialId', initialData.id);
      }

      const result = await uploadTestimonialImage(formData);

      if (result.success && result.imageUrl) {
        form.setValue('imageUrl', result.imageUrl);
        setImagePreview(result.imageUrl);
        toast({
          title: 'Success',
          description: 'Image uploaded successfully',
        });
      } else {
        throw new Error(result.error || 'Failed to upload image');
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    }
  };

  const removeImage = () => {
    form.setValue('imageUrl', '');
    setImagePreview(null);
  };

  return (
    <FormField
      control={form.control}
      name="imageUrl"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Profile Image</FormLabel>
          <FormControl>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <Image
                      src={imagePreview}
                      alt="Preview"
                      width={100}
                      height={100}
                      className="rounded-md object-cover"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={removeImage}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove image</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-md border border-dashed">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isLoading}
                  className="max-w-xs"
                />
                <input type="hidden" {...field} />
              </div>
              <p className="text-sm text-muted-foreground">
                Upload a profile image for the testimonial. Maximum size 5MB.
              </p>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
