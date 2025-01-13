"use client";

import { motion } from "framer-motion";
import { FruitCard } from "./fruit-card";
import { useState, useEffect } from "react";
import { Search, ShoppingCart } from "lucide-react";
import { CartSheet } from "./marcking-cart/CartSheet";
import { getProducts } from '@/app/actions/productActions';
import { Product } from '@/lib/supabase/db.types';

export function ProductSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        setIsError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const filteredProducts = products.filter((product: Product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
      <div className="space-y-32">
        <section id="products" className="w-full py-8 md:py-24 pb-32 relative z-30">
          <div className="container mx-auto px-2 md:px-6 relative z-30">
            <div className="mb-8 md:mb-12">
              <h2 className="mb-4 text-3xl md:text-4xl font-bold text-center">Fresh Fruits</h2>
              <p className="mx-auto max-w-2xl text-base md:text-lg text-gray-700 text-center">
                Discover our handpicked selection of fresh, organic fruits delivered straight to your door.
              </p>
            </div>

            <div className="max-w-md mx-auto mb-8 flex items-center gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search fruits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              <CartSheet isOpen={isCartOpen} onOpenChange={setIsCartOpen} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 max-w-[1920px] mx-auto mb-16">
              {isLoading && (
                <div className="col-span-full text-center py-8">
                  Loading products...
                </div>
              )}

              {isError && (
                <div className="col-span-full text-center py-8 text-red-500">
                  Error loading products. Please try again later.
                </div>
              )}

              {!isLoading && !isError && filteredProducts.map((product) => {
                const optimizedProduct = {
                  ...product,
                  imageUrl: product.imageUrl ? `${product.imageUrl}?w=500&q=75` : '/placeholder.svg'
                };
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FruitCard {...optimizedProduct} description={product.description || undefined} unit={product.unit || undefined} />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
