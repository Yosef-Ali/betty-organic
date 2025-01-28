'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface AboutContent {
  id?: number;
  title: string;
  content: string;
  images: string[];
}

export function SettingsAbout() {
  const { toast } = useToast();
  const [aboutContent, setAboutContent] = useState<AboutContent>({
    title: '',
    content: '',
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    if (aboutContent.images.length >= 3) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Maximum 3 images allowed',
      });
      return;
    }

    const file = e.target.files[0];
    // TODO: Implement image upload logic similar to testimonials
    // For now, we'll just use a placeholder URL
    setAboutContent(prev => ({
      ...prev,
      images: [...prev.images, URL.createObjectURL(file)],
    }));
  };

  const handleRemoveImage = (index: number) => {
    setAboutContent(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!aboutContent.title.trim() || !aboutContent.content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Title and content are required',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      // TODO: Implement save logic
      toast({
        title: 'Success',
        description: 'About content updated successfully',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update about content',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>About Section</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input
            placeholder="Title"
            value={aboutContent.title}
            onChange={(e) => setAboutContent(prev => ({ ...prev, title: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Textarea
            placeholder="Content"
            value={aboutContent.content}
            onChange={(e) => setAboutContent(prev => ({ ...prev, content: e.target.value }))}
            rows={5}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('image-upload')?.click()}
              disabled={aboutContent.images.length >= 3}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            {aboutContent.images.map((image, index) => (
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
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
}
