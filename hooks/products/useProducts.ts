// hooks/products/useProducts.ts
import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '@/app/actions/productActions';
import { transformAndFilterProducts } from '@/utils/products/productTransforms';
import { useToast } from '@/hooks/use-toast';
import type { ProductWithStatus } from '@/components/SalesPage';

export function useProducts() {
  const [products, setProducts] = useState<ProductWithStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const allProducts = await getProducts();
      const processedProducts = transformAndFilterProducts(allProducts);
      setProducts(processedProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch products. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    refetchProducts: fetchProducts,
  };
}
