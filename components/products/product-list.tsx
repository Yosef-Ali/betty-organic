"use client";

import { Suspense } from "react";
import { FruitCard } from "./fruit-card";
import { getProducts } from "@/app/actions/productActions";

interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  description?: string;
}

async function ProductListContent() {
  const products = await getProducts();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 max-w-[1920px] mx-auto mb-16">
      {products.map((product: Product) => (
        <FruitCard
          key={product.id}
          id={product.id}
          name={product.name}
          price={product.price}
          imageUrl={product.imageUrl ?? '/placeholder.svg'}
          description={product.description ?? ''}
          unit="unit"
        />
      ))}
    </div>
  );
}

export function ProductList() {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductListContent />
    </Suspense>
  );
}

function ProductListSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 max-w-[1920px] mx-auto mb-16">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="aspect-square w-full bg-gray-200 rounded-lg" />
          <div className="mt-2 h-4 bg-gray-200 rounded w-3/4" />
          <div className="mt-1 h-4 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
