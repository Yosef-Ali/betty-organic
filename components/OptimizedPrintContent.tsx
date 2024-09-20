import React, { useMemo } from "react";

interface OptimizedPrintContentProps {
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
}

export const OptimizedPrintContent: React.FC<OptimizedPrintContentProps> =
  React.memo(({ items, total }) => {
    const itemRows = useMemo(() => {
      return items.map((item, index) => (
        <div key={index} className="flex justify-between mb-2">
          <span>
            {item.name} x{item.quantity}
          </span>
          <span>${item.price.toFixed(2)}</span>
        </div>
      ));
    }, [items]);

    return (
      <div className="p-4 w-[300px]">
        <h2 className="text-center font-bold mb-4">Receipt</h2>
        {itemRows}
        <div className="border-t pt-2 mt-2">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  });

OptimizedPrintContent.displayName = "OptimizedPrintContent";
