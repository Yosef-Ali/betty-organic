'use client';

import { useState, useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ImageIcon, Camera, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { handleCustomerAvatarUpload } from './customer-avatar-server';

interface CustomerAvatarUploadProps {
  form: UseFormReturn<any>;
  name: string;
  label?: string;
  defaultImageUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  customerId?: string;
}

export function CustomerAvatarUpload({
  form,
  name,
  label,
  defaultImageUrl,
  className = '',
  size = 'md',
  customerId,
}: CustomerAvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create immediate preview URL for the selected file
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      const result = await handleCustomerAvatarUpload(formData, customerId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }

      if (!result.imageUrl) {
        throw new Error('No image URL returned from server');
      }

      // Update form with new image URL from server
      form.setValue(name, result.imageUrl, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      // After successful upload, clear preview and show final image
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      toast({
        title: 'Success',
        description: 'Customer photo updated successfully',
        variant: 'default',
      });
    } catch (error) {
      // Revert to previous state on error
      setPreviewUrl(null);
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }

      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description:
          error instanceof Error ? error.message : 'Failed to upload image',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setIsUploading(true);
      setPreviewUrl(null);
      form.setValue(name, '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      toast({
        description: 'Customer photo removed',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to remove image',
      });
    } finally {
      setIsUploading(false);
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
              <div className="flex flex-col items-center space-y-4">
                <div
                  className="relative cursor-pointer group"
                  onClick={handleClick}
                >
                  <Avatar className={getAvatarSize()}>
                    {previewUrl || field.value ? (
                      <AvatarImage
                        src={previewUrl || field.value}
                        alt="Customer avatar"
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
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </Avatar>

                  {field.value && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full"
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove photo</span>
                    </Button>
                  )}
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleClick}
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {field.value ? 'Change Photo' : 'Upload Photo'}
                </Button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                  className="hidden"
                  aria-label="Upload customer photo"
                />
                <input type="hidden" {...field} />
              </div>
              {isUploading && (
                <p className="text-sm text-muted-foreground animate-pulse">
                  Uploading customer photo...
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
