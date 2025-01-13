"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import { FruitCard } from "../fruit-card";
import { CartSheet } from "../marcking-cart/CartSheet";
import { useCartStore } from "@/store/cartStore";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  unit: string;
}

interface ProductSearchProps {
  products: readonly Product[];
}

export function ProductSearch({ products }: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { items } = useCartStore();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="max-w-md mx-auto mb-8 flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search fruits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 pr-4 text-gray-700 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        </div>
        <CartSheet items={items} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 max-w-[1920px] mx-auto mb-16">
        {filteredProducts.map((product) => (
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
              imageUrl={product.imageUrl}
              description={product.description}
              unit={product.unit}
            />
          </motion.div>
        ))}
      </div>
    </>
  );
}
