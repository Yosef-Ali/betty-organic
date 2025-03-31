import { Product } from '@/lib/supabase/db.types';

/**
 * Optimizes the product image URL or returns a placeholder.
 * Appends query parameters for image optimization (width 500px, quality 75).
 *
 * @param product - The product object.
 * @returns The optimized image URL string or the placeholder path.
 */
export function optimizeProductImage(product: Product): string {
  return product.imageUrl
    ? `${product.imageUrl}?w=500&q=75`
    : '/placeholder.svg';
}
