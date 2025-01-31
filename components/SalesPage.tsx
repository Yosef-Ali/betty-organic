'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import { useSalesCartStore, SalesCartItem } from '@/store/salesCartStore';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ProductGrid } from './ProductGrid';
import { SalesHeader } from './SalesHeader';
import { SalesCartSheet } from './cart/SalesCartSheet';
import { getProducts } from '@/app/actions/productActions';
import { Product } from '@/types/product';

export type ProductStatus = 'Available' | 'Out of Stock';
export type ProductWithStatus = Product & { status: ProductStatus };

const SalesPage: FC = () => {
  const [products, setProducts] = useState<ProductWithStatus[]>([]);
  const [recentlySelectedProducts, setRecentlySelectedProducts] = useState<
    ProductWithStatus[]
  >([]);
  const { addItem, items } = useSalesCartStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const allProducts = await getProducts();
        const productsWithStatus = allProducts.map((p: Product) => ({
          ...p,
          status: p.stock > 0 ? 'Available' : ('Out of Stock' as ProductStatus),
        }));

        // Filter out inactive products and set availability status
        setProducts(
          productsWithStatus
            .filter(p => p.active !== false) // Show active products only
            .filter(p => p.status === 'Available'),
        );
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    }
    fetchProducts();
  }, []);

  const handleProductClick = (product: ProductWithStatus) => {
    const cartItem: SalesCartItem = {
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl || '/placeholder.png',
      pricePerKg: product.price,
      grams: product.unit === 'kg' ? 1000 : 100, // Default to 1kg if unit is kg, else 100g
      unit: product.unit,
    };

    addItem(cartItem);

    // Add selected product to recently selected list
    setRecentlySelectedProducts(prev => {
      const alreadySelected = prev.some(p => p.id === product.id);
      if (alreadySelected) return prev;
      return [...prev, product];
    });

    setIsCartOpen(true);
  };

  const handleCartOpenChange = useCallback((open: boolean) => {
    setIsCartOpen(open);
  }, []);

  return (
    <main className="flex-1 md:p-4 sm:px-6 sm:py-0">
      <SalesHeader
        cartItemCount={items.length}
        onCartClick={() => setIsCartOpen(true)}
      />
      <Tabs defaultValue="all">
        <TabsContent value="all">
          <ProductGrid
            products={products}
            onProductClick={handleProductClick}
          />
        </TabsContent>
        <TabsContent value="recently-selected">
          <ProductGrid
            products={recentlySelectedProducts}
            onProductClick={handleProductClick}
          />
        </TabsContent>
      </Tabs>
      <SalesCartSheet isOpen={isCartOpen} onOpenChange={handleCartOpenChange} />
    </main>
  );
};

export default SalesPage;
