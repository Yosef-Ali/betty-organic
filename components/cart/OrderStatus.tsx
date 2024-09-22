// components/cart/OrderStatus.tsx
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Unlock } from "lucide-react";

interface OrderStatusProps {
  orderStatus: string;
  setOrderStatus: (status: string) => void;
  isStatusVerified: boolean;
  onToggleLock: () => void;
  hasToggledLock: boolean;
}

export const OrderStatus: React.FC<OrderStatusProps> = ({
  orderStatus,
  setOrderStatus,
  isStatusVerified,
  onToggleLock,
  hasToggledLock,
}) => {
  return (
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
        onClick={onToggleLock}
        disabled={hasToggledLock && !isStatusVerified}
      >
        {isStatusVerified ? (
          <Unlock className="h-4 w-4" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};
