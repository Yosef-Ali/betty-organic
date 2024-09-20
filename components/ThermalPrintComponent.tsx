import React from "react";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";

interface PrintContentProps {
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
}

export const PrintContent: React.FC<PrintContentProps> = ({ items, total }) => {
  return (
    <div className="p-4 w-[300px]">
      {" "}
      {/* Adjust width based on your thermal printer */}
      <h2 className="text-center font-bold mb-4">Receipt</h2>
      {items.map((item, index) => (
        <div key={index} className="flex justify-between mb-2">
          <span>
            {item.name} x{item.quantity}
          </span>
          <span>${item.price.toFixed(2)}</span>
        </div>
      ))}
      <div className="border-t pt-2 mt-2">
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

interface ThermalPrintComponentProps {
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
}

export const ThermalPrintComponent: React.FC<ThermalPrintComponentProps> = ({
  items,
  total,
}) => {
  const componentRef = useRef(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  return (
    <div>
      <div style={{ display: "none" }}>
        {" "}
        {/* Hidden print content */}
        <div ref={componentRef}>
          <PrintContent items={items} total={total} />
        </div>
      </div>
      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Print Receipt
      </button>
    </div>
  );
};
