import { CartItem as CartItemType } from "@/src/types/cart";
import Image from "next/image";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
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
          <p className="text-sm text-muted-foreground">{item.grams}g</p>
        </div>
      </div>
      <div className="flex flex-col items-end space-y-1">
        <span className="font-medium">
          ETB {(item.pricePerKg * (item.grams / 1000)).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
