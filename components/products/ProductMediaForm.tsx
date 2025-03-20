'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
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

const DEFAULT_PRODUCT_IMAGE = '/fruits/strawberrie.jpg';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

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

  const generateImage = useCallback(async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select an image first',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64String = await base64Promise;
      const base64Image = (base64String as string).split(',')[1];

      // Call Gemini API
      // Use local reference image for development
      const response = await fetch('/api/generate-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image,
          mimeType: selectedFile.type,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Convert base64 to file
      const generateFile = await fetch(`data:${selectedFile.type};base64,${data.image}`);
      const generatedBlob = await generateFile.blob();
      const generatedFile = new File([generatedBlob], `generated-${selectedFile.name}`, { type: selectedFile.type });

      // Upload generated image
      const formData = new FormData();
      formData.append('file', generatedFile);

      const uploadResponse = await uploadImage(formData) as ImageUploadResponse;
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || 'Failed to upload generated image');
      }

      if (uploadResponse.imageUrl) {
        form.setValue('imageUrl', uploadResponse.imageUrl);
        form.trigger('imageUrl');
        toast({
          title: 'Success',
          description: 'Image generated and uploaded successfully.',
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate image',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedFile, form, toast]);

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

    try {
      // Create a copy of the file to avoid issues with the original
      const fileForUpload = new File([file], file.name, { type: file.type });
      const formData = new FormData();
      formData.append('file', fileForUpload);

      const uploadResponse = await uploadImage(formData) as ImageUploadResponse;
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
      // Don't clear selectedFile here as we might need it for generation
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

                  {/* Image Selector */}
                  <div className="space-y-2">
                    {/* Generate Button */}
                    {selectedFile && (
                      <Button
                        type="button"
                        onClick={generateImage}
                        disabled={isGenerating}
                        className="w-full mb-4"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          'Generate Enhanced Image'
                        )}
                      </Button>
                    )}

                    <FormLabel className="text-sm">Select from library</FormLabel>
                    <ImageSelector
                      value={field.value}
                      onChange={url => {
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                          setPreviewUrl('');
                        }
                        field.onChange(url);
                      }}
                      onDelete={handleDeleteImage}
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
