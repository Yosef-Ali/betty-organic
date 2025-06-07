'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { UseFormReturn } from 'react-hook-form';
import { uploadImage } from '@/app/actions/upload-image';
import { deleteStorageImage } from '@/app/actions/deleteStorageImage';
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
import { X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const DEFAULT_PRODUCT_IMAGE = '/placeholder-product.svg';

// Create a placeholder component for better visual feedback
const ProductImagePlaceholder = () => (
  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
    <div className="w-16 h-16 mb-4 rounded-lg bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
      <svg
        className="w-8 h-8 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
    <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">No Image Selected</p>
    <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-4">
      Upload an image, select from library, or generate with AI
    </p>
  </div>
);

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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  // Get the current image to display - either the preview, form value, or default
  const currentImageUrl = previewUrl || form.getValues('imageUrl') || DEFAULT_PRODUCT_IMAGE;

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const result = await deleteStorageImage(imageUrl);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete image');
      }

      // Also clear the form value if it's the current image
      if (form.getValues('imageUrl') === imageUrl) {
        form.setValue('imageUrl', '');
      }

      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete image',
        variant: 'destructive',
      });
    }
  };


  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clean up previous preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create new preview URL for immediate feedback
    const newPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(newPreviewUrl);
    setSelectedFile(file);

    // Automatically upload to Supabase storage
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await uploadImage(formData);

      if (uploadResponse.success && uploadResponse.imageUrl) {
        // Update form with the uploaded image URL
        form.setValue('imageUrl', uploadResponse.imageUrl);
        form.trigger('imageUrl');
        
        // Clean up local preview since we now have the uploaded URL
        URL.revokeObjectURL(newPreviewUrl);
        setPreviewUrl('');
        setSelectedFile(null);

        toast({
          title: 'Success',
          description: 'Image uploaded successfully and added to library.',
        });

        // Trigger refresh of ImageSelector to show the new image
        setRefreshTrigger(prev => prev + 1);
      } else {
        throw new Error(uploadResponse.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload image to storage',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
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
                    {currentImageUrl && currentImageUrl !== DEFAULT_PRODUCT_IMAGE ? (
                      <Image
                        alt="Product preview"
                        className="object-cover"
                        fill
                        src={currentImageUrl}
                        sizes="(max-width: 768px) 100vw, 300px"
                        priority
                      />
                    ) : (
                      <ProductImagePlaceholder />
                    )}
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


                  {/* Image Selector */}
                  <div className="space-y-2">
                    <FormLabel className="text-sm">Select from library</FormLabel>
                    <ImageSelector
                      value={field.value}
                      onChange={url => {
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                          setPreviewUrl('');
                        }
                        setSelectedFile(null);
                        field.onChange(url);
                      }}
                      onDelete={handleDeleteImage}
                      refreshTrigger={refreshTrigger}
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

        {/* AI Image Generation Link at the bottom */}
        <div className="flex justify-center mt-4 pt-3 border-t">
          <Button variant="ghost" size="sm" className="text-sm flex items-center gap-2 text-muted-foreground hover:text-foreground" asChild>
            <a href="/dashboard/products/new/ai-studio">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                <path d="M7 7h.01" />
                <path d="M20.4 14.5 16 10 4 20" />
              </svg>
              Advanced AI Studio (Multiple Models)
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
