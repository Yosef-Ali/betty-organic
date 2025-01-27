'use client';

import { useState } from 'react';
import Image from 'next/image';
import { UseFormReturn } from 'react-hook-form';
import { createClient } from '@/lib/supabase/client';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ImageIcon, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TestimonialFormValues } from './TestimonialFormSchema';
import { processImage, formatBytes, getFileExtension } from '@/lib/utils/image';

interface ImageUploadProps {
  form: UseFormReturn<TestimonialFormValues>;
  testimonialId?: string;
}

export function ImageUpload({ form, testimonialId }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

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
      setIsUploading(true);

      // Process image (convert to WebP if not already)
      const { blob: processedBlob, isConverted } = await processImage(file);
      const extension = isConverted ? 'webp' : getFileExtension(file);
      const fileName = `${testimonialId || 'temp'}-${Date.now()}.${extension}`;
      const filePath = `testimonials/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('testimonials')
        .upload(filePath, processedBlob, {
          contentType: isConverted ? 'image/webp' : file.type,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('testimonials').getPublicUrl(filePath);

      // Update form
      form.setValue('image_url', publicUrl);

      // Show success message with size comparison
      const originalSize = formatBytes(file.size);
      const processedSize = formatBytes(processedBlob.size);
      const sizeMessage = isConverted
        ? `Size reduced from ${originalSize} to ${processedSize} (converted to WebP)`
        : `Size: ${processedSize} (already in WebP format)`;

      toast({
        title: 'Success',
        description: `Image uploaded successfully! ${sizeMessage}`,
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    form.setValue('image_url', '');
  };

  return (
    <FormField
      control={form.control}
      name="image_url"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Profile Image</FormLabel>
          <FormControl>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {field.value ? (
                  <div className="relative">
                    <Image
                      src={field.value}
                      alt="Profile preview"
                      width={100}
                      height={100}
                      className="rounded-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                      onClick={handleRemoveImage}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove image</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*,.webp"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="max-w-xs"
                />
                <input type="hidden" {...field} />
              </div>
              <p className="text-sm text-muted-foreground">
                {isUploading
                  ? 'Processing and uploading image...'
                  : 'Upload a profile image. Non-WebP images will be automatically converted. Maximum size 5MB.'}
              </p>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
