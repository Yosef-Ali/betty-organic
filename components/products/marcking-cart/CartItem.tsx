import { CartItem as CartItemType } from '../../../types/cart';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';
import { useMarketingCartStore } from '@/store/cartStore';

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
      <div className="sm:flex items-center space-x-4">
        <div className="relative hidden sm:block h-16 w-16 overflow-hidden rounded-md" style={{ position: 'relative' }}>
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="64px"
            className="object-cover"
            priority={false}
          />
        </div>
        <div>
          <h3 className="font-medium">{item.name}</h3>
          <p className="text-sm text-muted-foreground">
            ETB {item.pricePerKg.toFixed(2)} per kg
          </p>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(-100)}
          disabled={item.grams <= 100}
        >
          <Minus className="h-4 w-4" />
          <span className="sr-only">Decrease quantity</span>
        </Button>
        <Input
          type="number"
          min="0.1"
          step="0.1"
          value={(item.grams / 1000).toFixed(1)}
          onChange={handleDirectInput}
          className="w-16 text-center"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => handleQuantityChange(100)}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Increase quantity</span>
        </Button>
      </div>
    </div>
  );
}
