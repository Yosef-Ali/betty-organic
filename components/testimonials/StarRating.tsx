'use client';

import { Star } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { TestimonialFormValues } from './TestimonialFormSchema';

interface StarRatingProps {
  form: UseFormReturn<TestimonialFormValues>;
}

export function StarRating({ form }: StarRatingProps) {
  const handleRatingClick = (rating: number) => {
    form.setValue('rating', rating);
  };

  return (
    <FormField
      control={form.control}
      name="rating"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Rating</FormLabel>
          <FormControl>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => handleRatingClick(rating)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${
                      rating <= (field.value || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-none text-gray-300'
                    } transition-colors hover:fill-yellow-400 hover:text-yellow-400`}
                  />
                </button>
              ))}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
