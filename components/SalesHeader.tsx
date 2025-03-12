"use client";

import { FC } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { File, PlusCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { ProductCategory } from "@/types/supabase";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const PRODUCT_CATEGORIES: ProductCategory[] = [
  "All",
  "Spices_Oil_Tuna",
  "Flowers",
  "Vegetables",
  "Fruits",
  "Herbs_Lettuce",
  "Dry_Stocks_Bakery",
  "Eggs_Dairy_products"
];

interface SalesHeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
  selectedCategory: ProductCategory;
  onCategoryChange: (category: ProductCategory) => void;
}

export const SalesHeader: FC<SalesHeaderProps> = ({
  cartItemCount,
  onCartClick,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between">
        <Tabs defaultValue={selectedCategory} className="w-full">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex w-full justify-start">
              {PRODUCT_CATEGORIES.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  onClick={() => onCategoryChange(category)}
                  className="px-3"
                >
                  {category.replace(/_/g, ' ')}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </Tabs>
      </div>

      <div className="flex items-center justify-between">
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Button size="sm" className="h-10 gap-1" onClick={() => { }}>
            <Link href="/dashboard/products/new" className="flex items-center">
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Product
              </span>
            </Link>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={onCartClick}
          >
            <ShoppingCart className="h-5 w-5" />
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
            <span className="sr-only">Open cart</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
