'use client';

import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useMarketingCartStore } from '@/store/cartStore';
import { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const store = useMarketingCartStore();
  const updateItemQuantity = store?.updateItemQuantity;
  const removeFromCart = store?.removeFromCart;

  if (!item || !updateItemQuantity || !removeFromCart) {
    return null;
  }

  const handleQuantityChange = (value: number) => {
    const newGrams = Math.max(100, item.grams + value); // Minimum 100g
    updateItemQuantity(item.id, newGrams);
  };

  const handleDirectInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      const newGrams = Math.round(value * 1000); // Convert kg to grams
      updateItemQuantity(item.id, Math.max(100, newGrams)); // Ensure minimum 100g
    }
  };

  return (
    <div className="flex items-center justify-between space-x-4 py-4">
      <div className="flex items-center space-x-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-md">
          <Image
            src={item.imageUrl || '/placeholder-product.svg'}
            alt={item.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        </div>
        <div>
          <h3 className="text-sm font-medium">{item.name}</h3>
          <p className="text-sm text-muted-foreground">
            ETB {item.pricePerKg.toFixed(2)}/kg
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(-100)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={(item.grams / 1000).toFixed(1)}
          onChange={handleDirectInput}
          className="h-8 w-20 text-center"
          step="0.1"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(100)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={() => removeFromCart(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
