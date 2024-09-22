// components/cart/OrderSummary.tsx
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface OrderSummaryProps {
  items: Array<{ id: string; name: string; grams: number; pricePerKg: number }>;
  total: number;
  onPrint: () => void;
  onThermalPrintPreview: () => void;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items,
  total,
  onPrint,
  onThermalPrintPreview,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Order Summary</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={onThermalPrintPreview}>
            Thermal
          </Button>
        </div>
      </div>
      <div className="space-y-2 mb-4">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span>{item.name} ({item.grams}g)</span>
            <span>${((item.pricePerKg * item.grams) / 1000).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};



