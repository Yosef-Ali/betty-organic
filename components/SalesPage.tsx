'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import { useSalesCartStore, SalesCartItem } from '@/store/salesCartStore';
import { Tabs, TabsContent } from '@/components/ui/tabs';// Add this import
import { ProductGrid } from './ProductGrid';
import { SalesHeader } from './SalesHeader';
import { SalesCartSheet } from './cart/SalesCartSheet';
import { getProducts } from '@/app/actions/productActions';
import { toast } from '@/hooks/use-toast';
import { createOrder } from '@/app/actions/orderActions';
import { Order } from '@/types/order';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string;
  category: string;
  active: boolean;
  totalSales: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductAPIResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  category: string | null;
  active: boolean | null;
  total_sales: number;
  createdat: string;
  updated_at: string;
}

export interface ProductWithStatus extends Product {
  status: 'Available' | 'Out of Stock';
}

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
        const productsWithStatus = allProducts.map((p): ProductWithStatus => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price ?? 0,
          stock: p.stock ?? 0,
          imageUrl: p.imageUrl || '/default-product.png',
          category: p.category || 'Uncategorized',
          active: p.active ?? true,
          totalSales: p.totalsales ?? 0,
          createdAt: p.createdat ?? '',
          updatedAt: p.updatedat ?? '',
          status: (p.stock ?? 0) > 0 ? 'Available' : 'Out of Stock'
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
      grams: product.stock > 0 ? 1000 : 100, // Default to 1kg if stock is available, else 100g
      unit: 'kg',
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

  const handleOrderCreation = async (orderData: Order) => {
    try {
      const { data, error } = await createOrder(orderData);

      if (error) {
        toast({
          title: "Error creating order",
          description: error.message,
          variant: "destructive",
        });
        return false;
      }

      toast({
        title: "Order created successfully",
        description: `Order #${data.id} has been created`,
      });

      // Clear cart after successful order
      useSalesCartStore.getState().clearCart();
      setIsCartOpen(false);
      return true;
    } catch (err) {
      toast({
        title: "Error creating order",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Pass handleOrderCreation to SalesCartSheet
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
      <SalesCartSheet
        isOpen={isCartOpen}
        onOpenChange={handleCartOpenChange}
        onOrderCreate={handleOrderCreation}
      />
    </main>
  );
};

export default SalesPage;
