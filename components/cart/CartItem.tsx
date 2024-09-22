// components/cart/CartItem.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemProps {
  item: {
    id: string;
    name: string;
    grams: number;
    pricePerKg: number;
  };
  index: number;
  updateGrams: (id: string, grams: number) => void;
  removeFromCart: (id: string) => void;
  isLastItem: boolean;
}

export const CartItem: React.FC<CartItemProps> = ({
  item,
  index,
  updateGrams,
  removeFromCart,
  isLastItem,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newGrams = parseFloat(e.target.value);
    if (!isNaN(newGrams)) {
      updateGrams(item.id, newGrams);
    }
  };

  const handleIncrement = () => {
    updateGrams(item.id, item.grams + 100);
  };

  const handleDecrement = () => {
    if (item.grams > 100) {
      updateGrams(item.id, item.grams - 100);
    }
  };

  return (
    <div className={`flex items-center space-x-4 py-2 ${!isLastItem ? 'border-b' : ''}`}>
      <div className="flex-grow">
        <h3 className="font-medium">{item.name}</h3>
        <p className="text-sm text-gray-500">
          ${((item.pricePerKg * item.grams) / 1000).toFixed(2)}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleDecrement}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Input
          type="number"
          value={item.grams}
          onChange={handleInputChange}
          className="w-20 text-center"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleIncrement}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => removeFromCart(item.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};
