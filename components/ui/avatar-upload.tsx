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
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ImageIcon, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processImage, formatBytes } from '@/lib/utils/image';

interface AvatarUploadProps {
  form: UseFormReturn<any>;
  name: string; // form field name
  label?: string;
  bucketName: string; // e.g. 'profiles' or 'customers'
  entityId?: string; // e.g. userId or customerId
  defaultImageUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarUpload({
  form,
  name,
  label,
  bucketName,
  entityId,
  defaultImageUrl,
  className = '',
  size = 'md',
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const getAvatarSize = () => {
    switch (size) {
      case 'sm':
        return 'h-16 w-16';
      case 'lg':
        return 'h-32 w-32';
      default:
        return 'h-24 w-24';
    }
  };

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
      const extension = isConverted
        ? 'webp'
        : file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${entityId || 'temp'}-${Date.now()}.${extension}`;
      const filePath = `${bucketName}/${fileName}`;

      // Delete old image if exists
      const currentImageUrl = form.getValues(name);
      if (currentImageUrl) {
        const oldPath = currentImageUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from(bucketName)
            .remove([`${bucketName}/${oldPath}`]);
        }
      }

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
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
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      // Update form
      form.setValue(name, publicUrl);

      // Show success message with size comparison
      const originalSize = formatBytes(file.size);
      const processedSize = formatBytes(processedBlob.size);
      const sizeMessage = isConverted
        ? `Size reduced from ${originalSize} to ${processedSize}`
        : `Size: ${processedSize} (already optimized)`;

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

  const handleRemoveImage = async () => {
    const currentImageUrl = form.getValues(name);
    if (currentImageUrl) {
      try {
        setIsUploading(true);
        const path = currentImageUrl.split('/').pop();
        if (path) {
          await supabase.storage
            .from(bucketName)
            .remove([`${bucketName}/${path}`]);
        }
        form.setValue(name, '');
        toast({
          description: 'Image removed successfully',
        });
      } catch (error: any) {
        console.error('Error removing image:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to remove image',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <Avatar className={getAvatarSize()}>
                  {field.value ? (
                    <AvatarImage
                      src={field.value}
                      alt="Avatar"
                      className="object-cover"
                    />
                  ) : defaultImageUrl ? (
                    <AvatarImage
                      src={defaultImageUrl}
                      alt="Default avatar"
                      className="object-cover"
                    />
                  ) : (
                    <AvatarFallback>
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                  )}

                  {/* Upload Button */}
                  <div className="absolute -bottom-2 -right-2 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      asChild
                    >
                      <label htmlFor={`avatar-upload-${name}`}>
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Upload avatar</span>
                      </label>
                    </Button>
                    {field.value && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={handleRemoveImage}
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove avatar</span>
                      </Button>
                    )}
                  </div>
                </Avatar>

                {/* Hidden file input */}
                <Input
                  id={`avatar-upload-${name}`}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <input type="hidden" {...field} />
              </div>
              {isUploading && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Processing and uploading image...
                </p>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
