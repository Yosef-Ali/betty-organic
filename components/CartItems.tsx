import { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMarketingCartStore } from '@/store/cartStore';
import { CartItem } from './CartItem';

export const CartItems: FC = () => {
  const { items, removeFromCart, updateGrams } = useMarketingCartStore();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="cart-items"
        initial={{ opacity: 0, x: '-100%' }}
        animate={{ opacity: 1, x: '0%' }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
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
    </AnimatePresence>
  );
};
