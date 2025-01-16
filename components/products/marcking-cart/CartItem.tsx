import { CartItem as CartItemType } from "../../../types/cart";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useMarketingCartStore } from "@/store/cartStore";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateItemQuantity } = useMarketingCartStore();

  const handleQuantityChange = (value: number) => {
    const newGrams = Math.max(100, item.grams + value); // Minimum 100g
    updateItemQuantity(item.id, newGrams);
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      const newGrams = Math.round(value * 1000);
      updateItemQuantity(item.id, newGrams);
    }
  };

  return (
    <div className="flex items-center justify-between space-x-4 py-4">
      <div className="flex items-center space-x-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-md">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 64px) 100vw"
            className="object-cover"
            priority={false}
          />
        </div>
        <div className="space-y-1">
          <h4 className="font-medium leading-none">{item.name}</h4>
          <p className="text-sm text-muted-foreground">
            ETB {item.pricePerKg.toFixed(2)}/kg
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end space-y-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleQuantityChange(-100)}
            disabled={item.grams <= 100}
          >
            <Minus className="h-3 w-3" />
            <span className="sr-only">Decrease quantity</span>
          </Button>
          <div className="relative w-32">
            <Input
              type="text"
              min="0.1"
              value={item.grams / 1000}
              onChange={handleDirectInput}
              className="text-center"
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              kg
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => handleQuantityChange(100)}
          >
            <Plus className="h-3 w-3" />
            <span className="sr-only">Increase quantity</span>
          </Button>
        </div>
        <span className="font-medium">
          ETB {(item.pricePerKg * (item.grams / 1000)).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
