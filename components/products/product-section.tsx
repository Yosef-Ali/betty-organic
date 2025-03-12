'use client';

import { motion } from 'framer-motion';
import { FruitCard } from './fruit-card';
import { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, X, PackageSearch, RefreshCw } from 'lucide-react';
import { CartSheet } from './marcking-cart/CartSheet';
import { getProducts } from '@/app/actions/productActions';
import { Product } from '@/lib/supabase/db.types';
import debounce from 'lodash/debounce';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useMarketingCartStore } from '@/store/cartStore';

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

function EmptyState({
  searchQuery,
  selectedCategory,
  onReset
}: {
  searchQuery: string;
  selectedCategory: string;
  onReset: () => void;
}) {
  return (
    <div className="col-span-full py-12 flex flex-col items-center justify-center">
      <div className="rounded-full bg-gray-100/80 p-4 mb-4">
        <PackageSearch className="h-8 w-8 text-gray-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">
        No products found
      </h3>
      <p className="text-sm text-gray-500 text-center max-w-md mb-4">
        {searchQuery && selectedCategory !== 'All' ? (
          <>
            We couldn&apos;t find any products matching &quot;{searchQuery}&quot; in the {selectedCategory.replace(/_/g, ' ')} category.
          </>
        ) : searchQuery ? (
          <>
            We couldn&apos;t find any products matching &quot;{searchQuery}&quot;.
          </>
        ) : selectedCategory !== 'All' ? (
          <>
            No products available in the {selectedCategory.replace(/_/g, ' ')} category yet.
          </>
        ) : (
          'No products available at the moment.'
        )}
      </p>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset filters
        </Button>
      </div>
    </div>
  );
}

export function ProductSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof PRODUCT_CATEGORIES[number]>("All");

  const { items } = useMarketingCartStore();
  const cartItemCount = items.length;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setIsError(false);
        setErrorMessage('');

        const data = await getProducts();

        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid data format received');
        }

        setProducts(data);
      } catch (error) {
        setIsError(true);
        const errorMsg = error instanceof Error
          ? error.message
          : 'Failed to fetch products';
        setErrorMessage(errorMsg);
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const debouncedSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setIsSearching(false);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setIsSearching(true);
    debouncedSearch(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setIsSearching(false);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Our Products
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            Fresh organic products delivered to your doorstep
          </p>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>

          <div className="w-full max-w-4xl">
            <Tabs defaultValue="All" className="w-full">
              <ScrollArea className="w-full whitespace-nowrap rounded-md">
                <TabsList className="inline-flex w-full min-w-max">
                  {PRODUCT_CATEGORIES.map((category) => (
                    <TabsTrigger
                      key={category}
                      value={category}
                      onClick={() => setSelectedCategory(category)}
                      className="data-[state=active]:bg-primary px-4"
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

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {isLoading && (
            <div className="col-span-full flex items-center justify-center py-12">
              <div className="flex items-center gap-2">
                <div className="animate-spin">
                  <RefreshCw className="h-5 w-5 text-gray-500" />
                </div>
                <span className="text-sm text-gray-500">Loading products...</span>
              </div>
            </div>
          )}

          {isError && (
            <div className="col-span-full text-center py-8 text-red-500">
              {errorMessage || 'Error loading products. Please try again later.'}
            </div>
          )}

          {!isLoading && !isError && filteredProducts.length === 0 && (
            <EmptyState
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              onReset={resetFilters}
            />
          )}

          {!isLoading &&
            !isError &&
            filteredProducts.map(product => {
              const optimizedProduct = {
                ...product,
                imageUrl: product.imageUrl
                  ? `${product.imageUrl}?w=500&q=75`
                  : '/placeholder.svg',
              };
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <FruitCard
                    {...optimizedProduct}
                    description={product.description || undefined}
                    unit={product.unit || undefined}
                  />
                </motion.div>
              );
            })}
        </div>
      </div>
      <CartSheet isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
    </div>
  );
}
