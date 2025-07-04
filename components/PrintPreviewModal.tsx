import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Barcode from "react-barcode";

interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  customerInfo?: string;
  customerId?: string;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  items,
  total,
  customerInfo,
  customerId,
}) => {

  return (
    <>

      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Order Preview</DialogTitle>
          </DialogHeader>

          {/* Receipt content */}
          <div className="border p-4 rounded">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold">Receipt</h2>
              <p className="text-sm text-gray-500">
                Thank you for your purchase!
              </p>
            </div>
            {customerInfo && (
              <div className="mb-4 text-center">
                <p className="text-sm">Customer Info: {customerInfo}</p>
                {customerId && <p className="text-sm">Customer ID: {customerId}</p>}
              </div>
            )}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Items:</h3>
              <ul className="space-y-1">
                {items.map((item, index) => (
                  <li key={index} className="flex justify-between text-sm">
                    <span>
                      {item.name} x{item.quantity.toFixed(3)}kg
                    </span>
                    <span>${item.price.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex justify-between font-bold mb-4">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-center mb-4">
              <Barcode value={`ORDER-${Date.now()}`} width={1.5} height={50} />
            </div>
            <div className="text-center text-xs text-gray-500">
              <p>Order ID: {Date.now()}</p>
              <p>{new Date().toLocaleString()}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex justify-end mt-4">
            <Button onClick={onClose}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PrintPreviewModal;
