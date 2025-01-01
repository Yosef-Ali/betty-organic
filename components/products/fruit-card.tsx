"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { ShoppingCart, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/use-toast";

interface FruitCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  description?: string | null;  // Make description optional
  unit: string;
}

export function FruitCard({
  id,
  name,
  price,
  image,
  description = '', // Add default value
  unit = 'piece'
}: FruitCardProps) {
  const [imageError, setImageError] = useState(false);
  const hasValidImage = image && image.trim().length > 0 && !imageError;
  const { addItem } = useCartStore();

  // Convert unit to kg if it's lb
  const displayUnit = unit && unit.toLowerCase() === 'lb' ? 'kg' : unit || 'piece';

  const { toast } = useToast();

  const handleAddToCart = () => {
    const cartItem = {
      id,
      name,
      imageUrl: image,
      pricePerKg: unit.toLowerCase() === 'kg' ? price : price * 2.20462, // Convert price to per kg
      grams: 1000, // Default to 1kg
    };
    addItem(cartItem);
    toast({
      title: "Added to cart",
      description: `${name} has been added to your cart`,
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {hasValidImage ? (
          <button onClick={handleAddToCart} className="w-full h-full">
            <Image
              src={image}
              alt={name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16.67vw"
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
              priority
              onError={() => setImageError(true)}
            />
          </button>
        ) : (
          <button onClick={handleAddToCart} className="w-full h-full">
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
          </button>
        )}
        <Button
          className="absolute bottom-4 right-4 bg-yellow-500 hover:bg-yellow-600 text-white p-3 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10"
          aria-label="Add to cart"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-5 w-5" />
        </Button>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 text-gray-800">{name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {description || 'No description available'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">ETB {price.toLocaleString()}</span>
          <span className="text-sm text-gray-500">per {displayUnit}</span>
        </div>
      </div>
    </div>
  );
}
