'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Truck } from 'lucide-react';
import OrderTrackingDialog from '@/components/OrderTrackingDialog';

export function HeroContent() {
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  return (
    <motion.div
      className="flex flex-col items-center md:items-start text-center md:text-left relative z-20"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Badge
        variant="secondary"
        className="mb-4 md:mb-6 gap-1 bg-white/80 backdrop-blur-sm relative z-10"
      >
        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
        Rated #1 Fruit & Vegetable Delivery
      </Badge>

      <motion.div
        className="relative mb-4 md:mb-6 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white">
          Fresh Fruits &
          <br />
          <span className="text-green-600">Vegetables</span>,
          <br />
          <span className="text-orange-600">Delivered Daily</span>
        </h1>
      </motion.div>

      <motion.p
        className="mb-6 md:mb-8 max-w-lg text-base md:text-lg text-white/90 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Experience the convenience of having fresh, handpicked fruits and
        vegetables delivered right to your doorstep. Quality and freshness
        guaranteed with every delivery.
      </motion.p>

      <motion.div
        className="flex flex-col sm:flex-row items-center gap-3 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Button
          size="lg"
          className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
          onClick={() => {
            document
              .getElementById('products')
              ?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          Order Now
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="w-full sm:w-auto hover:bg-white/30"
          onClick={() => setIsTrackingOpen(true)}
        >
          <Truck className="mr-2 h-4 w-4" />
          Track Order
        </Button>
      </motion.div>

      {/* Order Tracking Dialog */}
      <OrderTrackingDialog 
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />
    </motion.div>
  );
}
