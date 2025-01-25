import { FC } from 'react';
import { motion } from 'framer-motion';
import { CartItem } from './CartItem';
<<<<<<< HEAD
import { useMarketingCartStore } from '@/store/cartStore';
=======
import { useSalesCartStore as useCartStore } from '@/store/salesCartStore';
>>>>>>> 718b3c6 (feat: add navigation skeleton, refactor navigation logic, and implement customer list fetching)

interface CartItemsProps {
  items: Array<{
    id: string;
    name: string;
    grams: number;
    pricePerKg: number;
    imageUrl: string;
  }>;
}

export const CartItems: FC<CartItemsProps> = ({ items }) => {
<<<<<<< HEAD
  const { removeFromCart, updateItemQuantity } = useMarketingCartStore();
=======
  const { removeFromCart, updateItemQuantity } = useCartStore();
>>>>>>> 718b3c6 (feat: add navigation skeleton, refactor navigation logic, and implement customer list fetching)

  return (
    <motion.div
      key="cart-items"
      initial={{ opacity: 0, x: '-100%' }}
      animate={{ opacity: 1, x: '0%' }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="space-y-4"
    >
      {items.map((item, index) => (
        <CartItem
          key={item.id}
          item={item}
          index={index}
          updateItemQuantity={updateItemQuantity}
          removeFromCart={removeFromCart}
          isLastItem={index === items.length - 1}
        />
      ))}
    </motion.div>
  );
};
