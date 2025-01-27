import { FC } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface OrderSummaryProps {
  items: Array<{
    id: string;
    name: string;
    grams: number;
    pricePerKg: number;
  }>;
  getTotalAmount: () => number;
  handlePrint: () => void;
  handleThermalPrintPreview: () => void;
}

const OrderSummary: FC<OrderSummaryProps> = ({
  items,
  getTotalAmount,
  handlePrint,
  handleThermalPrintPreview,
}) => (
  <motion.div
    key="order-summary"
    initial={{ opacity: 0, x: '100%' }}
    animate={{ opacity: 1, x: '0%' }}
    exit={{ opacity: 0, x: '-100%' }}
    transition={{
      type: 'spring',
      stiffness: 300,
      damping: 30,
    }}
    className="space-y-4"
  >
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-semibold text-lg">Order Summary</h3>
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleThermalPrintPreview}>
          Thermal
        </Button>
      </div>
    </div>
    <div className="space-y-2 mb-4">
      {Array.isArray(items) &&
        items.map(item => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>
              {item.name} ({item.grams}g)
            </span>
            <span>Br {((item.pricePerKg * item.grams) / 1000).toFixed(2)}</span>
          </div>
        ))}
      <div className="flex justify-between font-bold">
        <span>Total:</span>
        <span>Br {getTotalAmount().toFixed(2)}</span>
      </div>
    </div>
  </motion.div>
);

export default OrderSummary;
