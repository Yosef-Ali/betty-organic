import { FC } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Printer, Lock, Unlock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface OrderSummaryProps {
  items: Array<{
    id: string;
    name: string;
    grams: number;
    pricePerKg: number;
  }>;
  totalAmount: number;
  customerInfo: string;
  setCustomerInfo: (value: string) => void;
  orderStatus: string;
  setOrderStatus: (value: string) => void;
  isStatusVerified: boolean;
  handleToggleLock: () => void;
  handleConfirmDialog: (action: "save" | "cancel") => void;
  isSaving: boolean;
}

export const OrderSummary: FC<OrderSummaryProps> = ({
  items,
  totalAmount,
  customerInfo,
  setCustomerInfo,
  orderStatus,
  setOrderStatus,
  isStatusVerified,
  handleToggleLock,
  handleConfirmDialog,
  isSaving,
}) => {
  return (
    <motion.div
      key="order-summary"
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: "0%" }}
      exit={{ opacity: 0, x: "-100%" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="space-y-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-lg">Order Summary</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={() => { }}>
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
          <span>${totalAmount.toFixed(2)}</span>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <Label htmlFor="customer-info" className="text-sm font-medium">
            Customer Name or Phone (Optional)
          </Label>
          <Input
            id="customer-info"
            type="text"
            placeholder="Enter customer name or phone"
            value={customerInfo}
            onChange={(e) => setCustomerInfo(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex-grow">
            <Label htmlFor="order-status" className="text-sm font-medium">
              Order Status
            </Label>
            <Select
              value={orderStatus}
              onValueChange={setOrderStatus}
              disabled={!isStatusVerified}
            >
              <SelectTrigger id="order-status" className="mt-1">
                <SelectValue placeholder="Select order status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="mt-6"
            onClick={handleToggleLock}
            disabled={!isStatusVerified}
          >
            {isStatusVerified ? (
              <Unlock className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={() => handleConfirmDialog("cancel")}>
          Cancel
        </Button>
        <Button onClick={() => handleConfirmDialog("save")} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Order"}
        </Button>
      </div>
    </motion.div>
  );
};
