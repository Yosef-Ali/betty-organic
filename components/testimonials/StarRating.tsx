'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';

interface StarRatingProps {
  form: UseFormReturn<any>;
}

export function StarRating({ form }: StarRatingProps) {
  return (
    <FormField
      control={form.control}
      name="rating"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Rating</FormLabel>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                className={cn(
                  'p-2 rounded-full transition-colors hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                  'touch-manipulation', // Better touch target
                  rating <= field.value && 'text-yellow-500',
                )}
                onClick={() => field.onChange(rating)}
                aria-label={`Rate ${rating} stars`}
              >
                <Star
                  className={cn(
                    'w-8 h-8 md:w-6 md:h-6', // Larger on mobile
                    rating <= field.value ? 'fill-current' : 'fill-none',
                  )}
                />
              </button>
            ))}
          </div>
        </FormItem>
      )}
    />
  );
}
