'use client';

import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { useSalesCartStore, SalesCartItem } from '@/store/salesCartStore';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductGrid } from './ProductGrid';
import { SalesHeader } from './SalesHeader';
import { SalesCartSheet } from './cart/SalesCartSheet';
import { getProducts } from '@/app/actions/productActions';
import { toast, useToast } from '@/hooks/use-toast';
import { createOrder } from '@/app/actions/orderActions';
import { Order } from '@/types/order';
import { User } from '@/types/user';
import { SalesPageSkeleton } from './sales/SalesPageSkeleton';
// Import ProductCategory enum correctly
import type { Database } from '@/types/supabase';
type ProductCategory = Database['public']['Enums']['product_category'];
import { OrderHistory } from './OrderHistory';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

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

interface SalesPageProps {
  user: {
    id: string;
    user_metadata: {
      full_name?: string;
    };
    email?: string;
    profile: {
      id: string;
      role: string;
    };
    isAdmin: boolean;
  };
}

const SalesPage: FC<SalesPageProps> = ({ user }) => {
  const [products, setProducts] = useState<ProductWithStatus[]>([]);
  const [recentlySelectedProducts, setRecentlySelectedProducts] = useState<ProductWithStatus[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { items, addItem } = useSalesCartStore();
  const { toast } = useToast();

  const handleCartOpenChange = useCallback((open: boolean) => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to access the cart',
        variant: 'destructive',
      });
      return;
    }
    setIsCartOpen(open);
  }, [user, toast]);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const allProducts = await getProducts();
      const productsWithStatus = allProducts.map(
        (p): ProductWithStatus => ({
          id: p.id,
          name: p.name,
          description: p.description,
          price: p.price ?? 0,
          stock: p.stock ?? 0,
          imageUrl: p.imageUrl || '/placeholder-product.svg',
          category: p.category || 'Uncategorized',
          active: p.active ?? true,
          totalSales: p.totalsales ?? 0,
          createdAt: p.createdat || new Date().toISOString(),
          updatedAt: p.updatedat || new Date().toISOString(),
          status: (p.stock ?? 0) > 0 ? 'Available' : 'Out of Stock',
        }),
      );

      setProducts(
        productsWithStatus
          .filter(p => p.active !== false)
          .filter(p => p.status === 'Available'),
      );
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

  const handleProductClick = useCallback((product: ProductWithStatus) => {
    const cartItem: SalesCartItem = {
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl || '/placeholder-product.svg',
      pricePerKg: product.price,
      grams: product.stock > 0 ? 1000 : 100,
      unit: 'kg',
    };

    addItem(cartItem);

    setRecentlySelectedProducts(prev => {
      const alreadySelected = prev.some(p => p.id === product.id);
      if (alreadySelected) return prev;
      return [...prev, product];
    });

    setIsCartOpen(true);
  }, [addItem]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
      const matchesSearch = searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleCategoryChange = useCallback((category: ProductCategory) => {
    setSelectedCategory(category);
    toast({
      title: 'Category Updated',
      description: `Showing ${category.replace(/_/g, ' ')} products`,
    });
  }, [toast]);

  const handleCreateOrder = useCallback(
    async (orderData: any): Promise<boolean> => {
      try {
        if (!user) {
          toast({
            title: 'Authentication required',
            description: 'Please log in to create an order',
            variant: 'destructive',
          });
          return false;
        }

        const response = await createOrder(
          orderData.items,
          user.id,
          orderData.totalAmount,
          orderData.status || 'pending'
        );
        toast({
          title: 'Order created successfully',
          description: `Order #${response.order?.id || 'unknown'} has been created`,
        });

        useSalesCartStore.getState().clearCart();
        setIsCartOpen(false);
        return true;
      } catch (err) {
        console.error('Unexpected error during order creation:', err);
        toast({
          title: 'Error creating order',
          description:
            err instanceof Error
              ? err.message
              : 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [user, toast],
  );

  return (
    <div className="flex flex-col min-h-screen">
      <SalesHeader
        cartItemCount={items.length}
        onCartClickAction={() => handleCartOpenChange(true)}
        selectedCategory={selectedCategory}
        onCategoryChangeAction={handleCategoryChange}
        searchQuery={searchQuery}
        onSearchChangeAction={handleSearchChange}
        showCategoryTabs={false} // Hide category tabs from header as we'll move them inline
      />
      <div className="flex items-center justify-between mb-4">
        <Tabs defaultValue="products" className="flex-grow">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Order History</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto">
          <Tabs defaultValue={selectedCategory}>
            <ScrollArea className="whitespace-nowrap">
              <TabsList className="inline-flex justify-end">
                {["All", "Spices_Oil_Tuna", "Flowers", "Vegetables", "Fruits", "Herbs_Lettuce", "Dry_Stocks_Bakery", "Eggs_Dairy_products"].map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    onClick={() => handleCategoryChange(category as ProductCategory)}
                    className={`px-3`}
                  >
                    {category.replace(/_/g, ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>
              <ScrollBar orientation="horizontal" className="invisible" />
            </ScrollArea>
          </Tabs>
        </div>
      </div>
      <Tabs defaultValue="products" className="flex-grow">
        <TabsContent value="products" className="m-0">
          {isLoading ? (
            <SalesPageSkeleton />
          ) : (
            <ProductGrid products={filteredProducts} onProductClick={handleProductClick} />
          )}
        </TabsContent>
        <TabsContent value="orders" className="m-0">
          <OrderHistory userId={user.id} />
        </TabsContent>
      </Tabs>
      <SalesCartSheet
        isOpen={isCartOpen}
        onOpenChange={handleCartOpenChange}
        onOrderCreate={handleCreateOrder}
        user={user}
      />
    </div>
  );
};

export default SalesPage;
