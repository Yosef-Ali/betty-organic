import { FC } from "react";
import { motion } from "framer-motion";
import { CartItem } from "./CartItem";
import { useCartStore } from "@/store/cartStore";

interface CartItemsProps {
  items: Array<{
    id: string;
    name: string;
    grams: number;
    pricePerKg: number;
  }>;
}

export const CartItems: FC<CartItemsProps> = ({ items }) => {
  const { removeFromCart, updateGrams } = useCartStore();

  return (
    <motion.div
      key="cart-items"
      initial={{ opacity: 0, x: "-100%" }}
      animate={{ opacity: 1, x: "0%" }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-4"
    >
      {items.map((item, index) => (
        <CartItem
          key={item.id}
          item={item}
          index={index}
          updateGrams={updateGrams}
          removeFromCart={removeFromCart}
          isLastItem={index === items.length - 1}
        />
      ))}
    </motion.div>
  );
};
