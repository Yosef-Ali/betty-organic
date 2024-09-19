"use client";

import { FC } from "react";
import { ProductWithStatus } from "./SalesPage";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: ProductWithStatus[];
  onProductClick: (product: ProductWithStatus) => void;
}

export const ProductGrid: FC<ProductGridProps> = ({
  products,
  onProductClick,
}) => {
  return (
    <>
      <ScrollArea className="h-[calc(100vh-200px)] w-full">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => onProductClick(product)} // Directly handle click here
            />
          ))}
        </div>
      </ScrollArea>
      <div className="mt-4 text-xs text-muted-foreground">
        Showing <strong>{products.length}</strong> products
      </div>
    </>
  );
};
