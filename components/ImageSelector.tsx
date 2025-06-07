'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getStorageImages } from '@/app/actions/getStorageImages';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ImageSelectorProps {
  value?: string;
  onChange: (url: string) => void;
  onDelete?: (imageUrl: string) => void;
  className?: string;
  refreshTrigger?: number;
}

export function ImageSelector({ value, onChange, onDelete, className, refreshTrigger }: ImageSelectorProps) {
  const [images, setImages] = useState<{ name: string; url: string; }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadImages() {
      try {
        const storageImages = await getStorageImages();
        setImages(storageImages);
      } catch (error) {
        console.error('Failed to load images:', error);
      } finally {
        setLoading(false);
      }
    }

    loadImages();
  }, [refreshTrigger]);

  const handleDeleteClick = async (e: React.MouseEvent, imageUrl: string) => {
    e.stopPropagation();
    if (onDelete) {
      try {
        await onDelete(imageUrl);
        setImages(prevImages => prevImages.filter(img => img.url !== imageUrl));
        toast({
          title: 'Success',
          description: 'Image deleted successfully',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to delete image',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading images...</div>;
  }

  return (
    <ScrollArea className="h-[120px] w-full rounded-lg border bg-muted/50 p-2">
      <div className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <div
            key={index}
            className="relative"
          >
            <button
              type="button"
              onClick={() => onChange(image.url)}
              className={cn(
                "relative aspect-square w-full overflow-hidden rounded-md border transition-all hover:opacity-90",
                value === image.url ? "ring-2 ring-primary" : "hover:ring-2 hover:ring-muted-foreground/20"
              )}
            >
              <Image
                src={image.url}
                alt={image.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 33vw, 100px"
              />
            </button>
            {onDelete && (
              <button
                type="button"
                onClick={(e) => handleDeleteClick(e, image.url)}
                className="delete-btn"
                aria-label="Delete image"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {images.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          No images available
        </div>
      )}
    </ScrollArea>
  );
}
