'use client';

import { useState } from 'react';
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
import { uploadAvatar } from '@/app/actions/upload-avatar';

interface AvatarUploadProps {
  form: UseFormReturn<any>;
  name: string;
  label?: string;
  defaultImageUrl?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarUpload({
  form,
  name,
  label,
  defaultImageUrl,
  className = '',
  size = 'md',
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

    // Create immediate preview URL for the selected file
    const localPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(localPreviewUrl);

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadAvatar(formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }

      // Update form with new image URL from server
      const imageUrl = result.imageUrl;
      form.setValue(name, imageUrl, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });

      toast({
        description: 'Profile picture updated successfully',
      });
    } catch (error) {
      // Revert preview on error
      setPreviewUrl(null);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
      });
    } finally {
      setIsUploading(false);
      // Clean up the local preview URL
      if (localPreviewUrl) {
        URL.revokeObjectURL(localPreviewUrl);
      }
    }
  };

  const handleRemoveImage = async () => {
    try {
      setIsUploading(true);
      setPreviewUrl(null); // Clear preview URL
      form.setValue(name, '', {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      toast({
        description: 'Profile picture removed',
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
              <div className="relative">
                <Avatar className={getAvatarSize()}>
                  {(previewUrl || field.value) ? (
                    <AvatarImage
                      src={previewUrl || field.value}
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

                  <div className="absolute -bottom-2 -right-2 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      asChild
                      disabled={isUploading}
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
                  Uploading profile picture...
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
