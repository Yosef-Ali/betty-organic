"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Product } from '../../lib/types';

import { FruitCard } from "./fruit-card";
import { loadProducts } from "@/app/actions/productActions";

interface ProductSectionProps {
}

export function ProductSection() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const loadProductsAsync = async () => {
      const fetchedProducts = await loadProducts();
      setProducts(fetchedProducts);
      setLoading(false);
    };

    loadProductsAsync();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
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

            {/* Search Input */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search fruits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 max-w-[1920px] mx-auto mb-16">
              {filteredProducts.map((product) => (
                <FruitCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.imageUrl}
                  description={product.description || ''}
                  unit="unit" // Replace with actual unit if available
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}