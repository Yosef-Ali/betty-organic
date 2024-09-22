import { FC, useState } from "react";
import { Printer, Tag, ArrowRight, X, Loader2 } from "lucide-react";
import { CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";

export interface CartFooterProps {
  getTotalAmount: () => number;
  isPrintPreview: boolean;
  onPrintPreview: () => void;
  onPrint: () => void;
  onCancel: () => void;
  onThermalPrintPreview: () => void;
  onConfirmOrder: () => Promise<void>;
  isOrderConfirmed: boolean;
}

export const CartFooter: FC<CartFooterProps> = ({
  getTotalAmount,
  onPrintPreview,
  onThermalPrintPreview,
  onConfirmOrder,
  isOrderConfirmed,
}) => {
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleApplyCoupon = () => {
    if (coupon.trim()) {
      console.log("Applying coupon:", coupon);
      setAppliedCoupon(coupon);
      setCoupon("");
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon("");
  };

  const handleConfirmOrder = async () => {
    setIsLoading(true);
    try {
      await onConfirmOrder();
    } catch (error) {
      console.error("Failed to confirm order:", error);
      // Handle error (e.g., show error message to user)
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CardFooter className="flex-col items-stretch gap-6 pt-4">
      <Separator />
      <div className="flex justify-between items-center">
        <span className="font-semibold text-lg">Total:</span>
        <span className="font-bold text-2xl">
          ${getTotalAmount().toFixed(2)}
        </span>
      </div>
      <AnimatePresence mode="wait">
        {!isOrderConfirmed && (
          <motion.div
            key="pre-confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-2 bg-primary/10 rounded-md">
                <div className="flex items-center space-x-2">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    Applied: {appliedCoupon}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveCoupon}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    placeholder="Enter coupon code"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    className="pr-10"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleApplyCoupon}
                          className="absolute right-0 top-0 h-full"
                          disabled={!coupon.trim()}
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Apply Coupon</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            )}
            <Button
              onClick={handleConfirmOrder}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirming Order...
                </>
              ) : (
                "Confirm Order"
              )}
            </Button>
          </motion.div>
        )}
        {isOrderConfirmed && (
          <motion.div
            key="post-confirm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-2 gap-2"
          >
            <Button variant="outline" onClick={onPrintPreview}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Button variant="outline" onClick={onThermalPrintPreview}>
              Thermal Print
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </CardFooter>
  );
};
