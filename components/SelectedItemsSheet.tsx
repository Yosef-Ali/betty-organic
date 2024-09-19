import { FC } from "react"
import { CartItem as CartItemType } from '@/store/cartStore'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface SelectedItemsSheetProps {
  items: CartItemType[]
  removeFromCart: (id: string) => void
  updateGrams: (id: string, grams: number) => void
}

export const SelectedItemsSheet: FC<SelectedItemsSheetProps> = ({ items, removeFromCart, updateGrams }) => {
  return (
    <div className="p-4">
      {items.map((item) => (
        <div key={item.id} className="mb-4">
          <div className="flex justify-between">
            <div className="flex items-center">
              <div className="flex items-center flex-1 max-w-[200px]">
                <p className="font-bold text-lg">
                  ${((item.pricePerKg * item.grams) / 1000).toFixed(2)}
                </p>
                <span className="ml-2">
                  {item.grams >= 1000 ? `${(item.grams / 1000).toFixed(2)} kg` : `${item.grams} g`}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive"
              onClick={() => removeFromCart(item.id)}
            >
              Remove
            </Button>
          </div>
          <Separator className="mt-2" />
        </div>
      ))}
    </div>
  )
}