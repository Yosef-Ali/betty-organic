'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import {
  AboutContent,
  saveAbout,
  getAbout,
} from '@/app/actions/aboutActions';
import { uploadAboutImage } from '@/app/actions/upload-about-image';
import { compressImage } from '@/app/utils/imageCompression';

export function SettingsAbout() {
  const { toast } = useToast();
  const [aboutContent, setAboutContent] = useState<AboutContent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    loadAboutContent();
  }, []);

  const loadAboutContent = async () => {
    try {
      const content = await getAbout();
      setAboutContent(
        content || {
          id: '',
          title: '',
          content: '',
          images: [],
          active: true,
          created_at: '',
          updated_at: '',
          created_by: '',
        },
      );
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load about content',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    if ((aboutContent?.images?.length || 0) >= 3) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Maximum 3 images allowed',
      });
      return;
    }

    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'File size must be less than 5MB',
      });
      return;
    }

    try {
      setIsUploading(true);
      toast({
        title: 'Processing',
        description: 'Compressing and uploading image...',
      });

      const compressedBlob = await compressImage(file);
      const formData = new FormData();
      formData.append('image', compressedBlob);

      const result = await uploadAboutImage(formData);

      if (!result.success || !result.imageUrl) {
        throw new Error(result.error || 'Failed to upload image');
      }

      setAboutContent(prev => ({
        ...prev!,
        images: [...(prev?.images || []), result.imageUrl!],
      }));

      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload image',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    if (!aboutContent) return;
    setAboutContent(prev => ({
      ...prev!,
      images: prev!.images.filter((_, i) => i !== index),
    }));

    toast({
      title: 'Success',
      description: 'Image removed successfully',
    });
  };

  const handleSubmit = async () => {
    if (!aboutContent?.title?.trim() || !aboutContent?.content?.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Title and content are required',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await saveAbout({
        id: aboutContent.id,
        title: aboutContent.title.trim(),
        content: aboutContent.content.trim(),
        images: aboutContent.images,
      });

      if (!result) throw new Error('Failed to save about content');

      toast({
        title: 'Success',
        description: 'About content updated successfully',
      });
      await loadAboutContent();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update about content',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>About Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded-md" />
            <div className="h-32 bg-gray-200 rounded-md" />
            <div className="h-48 bg-gray-200 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>About Section</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Title"
            value={aboutContent?.title || ''}
            onChange={e =>
              setAboutContent(prev => ({ ...prev!, title: e.target.value }))
            }
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Textarea
            placeholder="Content"
            value={aboutContent?.content || ''}
            onChange={e =>
              setAboutContent(prev => ({ ...prev!, content: e.target.value }))
            }
            rows={5}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('image-upload')?.click()}
              disabled={isSubmitting || isUploading || (aboutContent?.images?.length || 0) >= 3}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
              disabled={isUploading || isSubmitting}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {aboutContent?.images.map((image, index) => (
              <div key={index} className="relative group">
                <Image
                  src={image}
                  alt={`About image ${index + 1}`}
                  width={200}
                  height={200}
                  className="object-cover w-full h-32 rounded-md"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveImage(index)}
                  disabled={isSubmitting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || isUploading}
          className="w-full"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}
