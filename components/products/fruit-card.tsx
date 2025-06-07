import { Button } from "@/components/ui/button";
import { ShoppingCart, ImageIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useMarketingCartStore } from "@/store/cartStore";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/lib/supabase/db.types";

interface FruitCardProps {
  product: Product;
}

export function FruitCard({ product }: FruitCardProps) {
  const [imageError, setImageError] = useState(false);
  const hasValidImage = product.imageUrl && product.imageUrl.trim().length > 0 && !imageError;
  const { addItem } = useMarketingCartStore();
  const { toast } = useToast();

  const handleAddToCart = () => {
    const cartItem = {
      id: product.id,
      name: product.name,
      imageUrl: product.imageUrl || '',
      pricePerKg: product.price, // Use the raw price directly
      grams: 1000,
    };
    addItem(cartItem);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart`,
    });
  };

  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-md hover:shadow-lg transition-all duration-300">
      <div className="relative aspect-square w-full overflow-hidden bg-gray-100">
        {hasValidImage ? (
          <button onClick={handleAddToCart} className="relative w-full h-full">
            <Image
              src={product.imageUrl || '/placeholder-product.svg'}
              alt={product.name}
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
        <h3 className="font-semibold text-lg mb-1 text-gray-800">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {product.description || 'No description available'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">ETB {product.price.toLocaleString()}</span>
          <span className="text-sm text-gray-500">per kg</span>
        </div>
      </div>
    </div>
  );
}
