'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getStorageImages } from '@/app/actions/getStorageImages';
import { cn } from '@/lib/utils';

interface ImageSelectorProps {
  value?: string;
  onChange: (url: string) => void;
  className?: string;
}

export function ImageSelector({ value, onChange, className }: ImageSelectorProps) {
  const [images, setImages] = useState<{ name: string; url: string; }[]>([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

  if (loading) {
    return <div className="text-center py-4">Loading images...</div>;
  }

  return (
    <ScrollArea className="h-[120px] w-full rounded-lg border bg-muted/50 p-2">
      <div className="grid grid-cols-3 gap-2">
        {images.map((image, index) => (
          <button
            key={index}
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
