"use client";

import { FC, useState, useEffect, useCallback } from "react";
import { useCartStore } from "@/store/cartStore";
import { Tabs, TabsContent } from "@/components/ui/tabs";

import { ProductGrid } from "./ProductGrid";
import { SalesHeader } from "./SalesHeader";
import { Product } from "@prisma/client";
import { getProducts } from "@/app/actions/productActions";
import { CartSheet } from "./cart/CartSheet";

export type ProductStatus = "Available" | "Out of Stock";
export type ProductWithStatus = Product & { status: ProductStatus };

const Sales: FC = () => {
  const [products, setProducts] = useState<ProductWithStatus[]>([]);
  const [recentlySelectedProducts, setRecentlySelectedProducts] = useState<
    ProductWithStatus[]
  >([]);
  const { addItem, items } = useCartStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    async function fetchProducts() {
      const allProducts = await getProducts();
      const productsWithStatus = allProducts.map((p: Product) => ({
        ...p,
        status: p.stock > 0 ? "Available" : ("Out of Stock" as ProductStatus),
      }));

      setProducts(productsWithStatus.filter((p) => p.status === "Available"));
    }
    fetchProducts();
  }, []);

  const handleProductClick = (product: ProductWithStatus) => {
    addItem({
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl, // Ensure imageUrl is used
      pricePerKg: product.price,
      grams: 100,
    });

    // Add selected product to recently selected list
    setRecentlySelectedProducts((prev) => {
      const alreadySelected = prev.some((p) => p.id === product.id);
      if (alreadySelected) return prev;
      return [...prev, product];
    });

    setIsCartOpen(true);
  };

  const handleCartOpenChange = useCallback((open: boolean) => {
    setIsCartOpen(open);
  }, []);

  return (
    <main className="flex-1 p-4 sm:px-6 sm:py-0">
      <SalesHeader
        cartItemCount={items.length}
        onCartClick={() => setIsCartOpen(true)}
      />
      <Tabs defaultValue="all">
        <TabsContent value="all">
          <ProductGrid
            products={products}
            onProductClick={handleProductClick} // Pass the product click handler
          />
        </TabsContent>
        <TabsContent value="recently-selected">
          <ProductGrid
            products={recentlySelectedProducts}
            onProductClick={handleProductClick} // Handle click for recently selected
          />
        </TabsContent>
      </Tabs>
      <CartSheet isOpen={isCartOpen} onOpenChange={handleCartOpenChange} />
    </main>
  );
};

export default Sales;
