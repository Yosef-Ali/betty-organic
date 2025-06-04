"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import { useMarketingCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatOrderCurrency } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useMarketingCartStore();

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl || "/placeholder-product.svg",
      pricePerKg: product.price,
      grams: 1000, // Default to 1kg
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card
        className="overflow-hidden h-full group relative cursor-pointer"
        onClick={handleAddToCart}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
        <Image
          src={product.imageUrl || "/placeholder-product.svg"}
          alt={product.name}
          width={300}
          height={300}
          className="h-full w-full object-cover transition-all group-hover:scale-110 duration-300"
          onClick={(e) => e.stopPropagation()}
        />
        <CardContent className="absolute inset-0 p-4 flex flex-col justify-end z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-white"
          >
            <h3 className="font-semibold text-lg sm:text-xl mb-1">
              {product.name}
            </h3>
            <p className="text-sm mb-2 line-clamp-2">{product.description}</p>
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">
                {formatOrderCurrency(product.price)}/kg
              </p>
              <Button
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart();
                }}
                className="bg-white text-black hover:bg-white/90 rounded-full"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="sr-only">Add to Cart</span>
              </Button>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
