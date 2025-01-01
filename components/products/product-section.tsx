"use client";

import { motion } from "framer-motion";
import { FruitCard } from "./fruit-card";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase/supabaseClient";
import { Product } from "@/types";

export function ProductSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('name');

        if (error) throw error;

        setProducts(data || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Failed to load products. Please try again later.");
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (error) {
    return (
      <div className="w-full py-12 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px]  px-4 sm:px-6 lg:px-8">
      <div className="space-y-32">
        <section id="products" className="w-full py-8 md:py-24 pb-32 relative z-30">
          <div className="container mx-auto px-2 md:px-6 relative z-30">
            <div className="mb-8 md:mb-12">
              <h2 className="mb-4 text-3xl md:text-4xl font-bold text-center">Fresh Fruits</h2>
              <p className="mx-auto max-w-2xl text-base md:text-lg text-gray-700 text-center">
                Discover our handpicked selection of fresh, organic fruits delivered straight to your door.
              </p>
            </div>

            {/* Search Input */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search fruits..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 max-w-[1920px] mx-auto mb-16">
              {loading ? (
                // Loading skeleton
                [...Array(12)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="bg-gray-200 rounded-lg h-40 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))
              ) : (
                filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <FruitCard
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.imageUrl} // Changed from image_url to imageUrl
                      description={product.description}
                      unit={product.unit}
                    />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
