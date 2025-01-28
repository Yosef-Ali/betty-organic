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
import { uploadAvatar } from '@/app/actions/upload-avatar';

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

    try {
      setIsUploading(true);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Upload using server action
      const result = await uploadAvatar(formData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload image');
      }

      // Update form with new image URL
      const imageUrlWithTimestamp = `${result.imageUrl}?t=${Date.now()}`;
      form.setValue(name, imageUrlWithTimestamp, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });

      toast({
        description: 'Profile picture updated successfully',
      });
    } catch (error: any) {
      console.error('Image upload error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to upload image',
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
        const path = currentImageUrl.split('/').pop()?.split('?')[0];
        if (path) {
          await supabase.storage
            .from('public')
            .remove([`profiles/${path}`]);
        }
        form.setValue(name, '', {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true
        });
        toast({
          description: 'Profile picture removed',
        });
      } catch (error: any) {
        console.error('Error removing image:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error.message || 'Failed to remove image',
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
                      key={field.value}
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
