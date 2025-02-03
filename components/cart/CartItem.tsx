import React, { FC, useEffect, useRef } from "react";
import Image from 'next/image';
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
  index: number;
  updateGrams: (id: string, grams: number) => void;
  removeFromCart: (id: string) => void;
  isLastItem: boolean;
}

export const CartItem: FC<CartItemProps> = ({ item, index, updateGrams, removeFromCart, isLastItem }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLastItem && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLastItem]);

  const handleGramsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGrams = Number(e.target.value) || 0;
    updateGrams(item.id, newGrams);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="mb-6 px-2">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start">
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={64}
            height={64}
            className="rounded-md mr-4 object-cover"
          />
          <div>
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-sm text-muted-foreground">Br {item.pricePerKg.toFixed(2)} per kg</p>
          </div>
        </div>
        <p className="font-bold text-lg">
          Br {((item.pricePerKg * item.grams) / 1000).toFixed(2)}
        </p>
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center flex-1 max-w-[200px]">
          <Input
            id={`grams-${item.id}`}
            type="number"
            value={item.grams}
            onChange={handleGramsChange}
            onFocus={handleFocus}
            className="text-lg font-semibold w-24"
            ref={inputRef}
          />
          <Label htmlFor={`grams-${item.id}`} className="text-base font-medium ml-2 whitespace-nowrap">
            {item.grams >= 1000 ? `${(item.grams / 1000).toFixed(2)} kg` : `${item.grams} g`}
          </Label>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => removeFromCart(item.id)}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
      {!isLastItem && <Separator className="mt-4" />}
    </div>
  );
};
