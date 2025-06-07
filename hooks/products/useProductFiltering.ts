// hooks/products/useProductFiltering.ts
import { useMemo } from 'react';
import type { ProductWithStatus } from '@/components/SalesPage';
import type { Database } from '@/types/supabase';

type ProductCategory = Database['public']['Enums']['product_category'];

interface UseProductFilteringProps {
  products: ProductWithStatus[];
  selectedCategory: ProductCategory;
  searchQuery: string;
}

export function useProductFiltering({
  products,
  selectedCategory,
  searchQuery,
}: UseProductFilteringProps) {
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Category filter
      const categoryMatch = selectedCategory === "All" || 
        product.category === selectedCategory;
      
      // Search filter
      const searchMatch = searchQuery === "" || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return categoryMatch && searchMatch;
    });
  }, [products, selectedCategory, searchQuery]);

  return { filteredProducts };
}
