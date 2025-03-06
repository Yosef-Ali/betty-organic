'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadOnlyStarRatingProps {
  rating: number;
  className?: string;
}

export function ReadOnlyStarRating({ rating, className }: ReadOnlyStarRatingProps) {
  return (
    <div className={cn('flex gap-0.5', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            'w-4 h-4',
            star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 fill-none'
          )}
        />
      ))}
    </div>
  );
}
