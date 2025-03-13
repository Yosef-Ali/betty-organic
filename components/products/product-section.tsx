'use client';

import { motion } from 'framer-motion';
import { FruitCard } from './fruit-card';
import { useState, useEffect } from 'react';
import { Search, ShoppingCart, X, PackageSearch, RefreshCw } from 'lucide-react';
import { CartSheet } from './marcking-cart/CartSheet';
import { Product } from '@/lib/supabase/db.types';
import debounce from 'lodash/debounce';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useMarketingCartStore } from '@/store/cartStore';
import { useUIStore } from '@/store/uiStore';

const PRODUCT_CATEGORIES = [
  "All",
  "Spices_Oil_Tuna",
  "Flowers",
  "Vegetables",
  "Fruits",
  "Herbs_Lettuce",
  "Dry_Stocks_Bakery",
  "Eggs_Dairy_products"
] as const;

export function ProductSection({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<typeof PRODUCT_CATEGORIES[number]>("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isCartOpen, setCartOpen } = useUIStore();

  const refreshProducts = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/products');
      const newProducts = await response.json();
      setProducts(newProducts);
    } catch (error) {
      console.error('Failed to refresh products:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section className="py-12">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full sm:w-[300px] rounded-md border border-input bg-background text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={refreshProducts}
                disabled={isRefreshing}
                className="hidden sm:flex"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <CartSheet isOpen={isCartOpen} onOpenChange={setCartOpen} />
          </div>

          <ScrollArea className="w-full">
            <Tabs defaultValue="All" className="w-full">
              <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-full">
                {PRODUCT_CATEGORIES.map((category) => (
                  <TabsTrigger
                    key={category}
                    value={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow ${selectedCategory === category ? 'bg-white shadow' : ''
                      }`}
                  >
                    {category.replace(/_/g, ' ')}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <PackageSearch className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
            <Button variant="outline" onClick={() => {
              setSearchQuery('');
              setSelectedCategory("All");
            }}>
              Clear filters
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          >
            {filteredProducts.map((product) => (
              <FruitCard key={product.id} product={product} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
