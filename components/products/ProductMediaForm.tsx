'use client';

import { useState } from 'react';
import Image from 'next/image';
import { UseFormReturn } from 'react-hook-form';
import { uploadImage } from '@/app/actions/upload-image';
import { ImageSelector } from '@/components/ImageSelector';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ProductFormValues, ImageUploadResponse } from './ProductFormSchema';

const DEFAULT_PRODUCT_IMAGE = '/placeholder-product.jpg';

interface ProductMediaFormProps {
  form: UseFormReturn<ProductFormValues>;
  isLoading: boolean;
  initialData?: ProductFormValues & { id: string };
}

export function ProductMediaForm({
  form,
  isLoading,
  initialData,
}: ProductMediaFormProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { toast } = useToast();

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clean up previous preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create new preview URL
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setSelectedFile(file);

    // Create form data for upload
    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadResponse = (await uploadImage(
        formData,
      )) as ImageUploadResponse;
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || 'Failed to upload image');
      }

      if (uploadResponse.imageUrl) {
        // Update form with the new image URL
        form.setValue('imageUrl', uploadResponse.imageUrl);
        // Clean up preview URL after successful upload
        URL.revokeObjectURL(newPreviewUrl);
        setPreviewUrl('');
        // Trigger validation
        form.trigger('imageUrl');
        // Show success message
        toast({
          title: 'Success',
          description: 'Image uploaded successfully.',
        });
      } else {
        throw new Error('No image URL received from upload');
      }
    } catch (error) {
      console.error('Error in handleImageUpload:', error);
      // Show error message
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to upload image',
        variant: 'destructive',
      });
      // Clean up preview URL on error
      URL.revokeObjectURL(newPreviewUrl);
      setPreviewUrl('');
      // Reset form to previous value
      form.setValue('imageUrl', initialData?.imageUrl || '');
    } finally {
      setSelectedFile(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Image</CardTitle>
        <CardDescription>
          Upload or select an image for your product
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Image</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {/* Main Preview Area */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
                    <Image
                      alt="Product preview"
                      className="object-cover"
                      fill
                      src={previewUrl || field.value || DEFAULT_PRODUCT_IMAGE}
                      sizes="(max-width: 768px) 100vw, 300px"
                      priority
                    />
                  </div>

                  {/* Upload Controls */}
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isLoading}
                      className="cursor-pointer flex-1"
                    />
                  </div>

                  {/* Image Selector Grid */}
                  <div className="space-y-2">
                    <FormLabel className="text-sm">
                      Select from library
                    </FormLabel>
                    <ImageSelector
                      value={field.value}
                      onChange={url => {
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                          setPreviewUrl('');
                        }
                        field.onChange(url);
                      }}
                    />
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Upload a new image or select from the image library
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
