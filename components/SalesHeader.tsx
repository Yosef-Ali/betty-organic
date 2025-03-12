"use client";

import { FC } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { File, PlusCircle, ShoppingCart, Search, X } from "lucide-react";
import Link from "next/link";
import { ProductCategory } from "@/types/supabase";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

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
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const SalesHeader: FC<SalesHeaderProps> = ({
  cartItemCount,
  onCartClick,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
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
    </div>
  );
};
