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
import { Textarea } from '@/components/ui/textarea';

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
  const [isUploading, setIsUploading] = useState(false);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
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

      // Call Gemini API with the additional prompt if provided
      const response = await fetch('/api/generate-product-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Image,
          mimeType: selectedFile.type,
          prompt: additionalPrompt.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!data.success) throw new Error(data.error);

      // Convert base64 to file
      const generateFile = await fetch(`data:${selectedFile.type};base64,${data.image}`);
      const generatedBlob = await generateFile.blob();
      const generatedFile = new File([generatedBlob], `generated-${selectedFile.name}`, { type: selectedFile.type });

      // Create new preview URL for the generated image
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreviewUrl = URL.createObjectURL(generatedFile);
      setPreviewUrl(newPreviewUrl);
      setSelectedFile(generatedFile);

      toast({
        title: 'Success',
        description: 'Image enhanced successfully. Click Save to upload it.',
      });
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
  }, [selectedFile, additionalPrompt, previewUrl, toast]);

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
  };

  const saveGeneratedImage = async () => {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'No image to save',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', selectedFile);

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
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
        setSelectedFile(null);
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
      console.error('Error in saving image:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to upload image',
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
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted"></div>
                  {(isGenerating || isUploading) ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="text-sm font-medium">
                          {isGenerating ? 'Enhancing image...' : 'Uploading image...'}
                        </span>
                      </div>
                    </div>
                  ) : null}
                  <Image
                    alt="Product preview"
                    className="object-cover"
                    fill
                    src={currentImageUrl}
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
                    disabled={isLoading || isGenerating || isUploading}
                    className="cursor-pointer flex-1"
                  />
                </div>

                {/* Image Generation Controls */}
                {selectedFile && (
                  <div className="space-y-3 p-3 border rounded-md">
                    <FormLabel className="text-sm">Additional instructions for image enhancement</FormLabel>
                    <Textarea
                      placeholder="E.g., Make it more vibrant, Remove background, etc."
                      value={additionalPrompt}
                      onChange={(e) => setAdditionalPrompt(e.target.value)}
                      disabled={isGenerating || isUploading}
                      className="resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={generateImage}
                        disabled={isGenerating || isUploading}
                        className="flex-1"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Enhancing...
                          </>
                        ) : (
                          'Enhance Image'
                        )}
                      </Button>
                      <Button
                        type="button"
                        onClick={saveGeneratedImage}
                        disabled={isUploading || isGenerating || !selectedFile}
                        className="flex-1"
                        variant="secondary"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          'Save Image'
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Image Selector */}
                <div className="space-y-2"></div>
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
                />
              </div>
            </div>
              </FormControl>
      <FormDescription>
        Upload a new image or select from the image library
      </FormDescription>
      <FormMessage />
    </FormItem>
  )
}
        />
      </CardContent >
    </Card >
  );
}
