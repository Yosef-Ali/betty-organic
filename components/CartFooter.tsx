import { FC, useState } from "react";
import { Printer, X, Tag, ArrowRight } from "lucide-react";
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

type CartFooterProps = {
  getTotalAmount: () => number;
  isPrintPreview: boolean;
  onPrintPreview: () => void;
  onPrint: () => void;
  onCancel: () => void;
  onThermalPrintPreview: () => void;
};

export const CartFooter: FC<CartFooterProps> = ({
  getTotalAmount,
  isPrintPreview,
  onPrintPreview,
  onPrint,
  onCancel,
  onThermalPrintPreview,
}) => {
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");

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

  return (
    <CardFooter className="flex-col items-stretch gap-6 pt-4">
      <Separator />
      {!isPrintPreview && (
        <div className="flex justify-between items-center">
          <span className="font-semibold text-lg">Total:</span>
          <span className="font-bold text-2xl">
            ${getTotalAmount().toFixed(2)}
          </span>
        </div>
      )}
      {!isPrintPreview && (
        <div className="space-y-4">
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
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 mt-2">
        {isPrintPreview ? (
          <>
            <Button variant="outline" onClick={onCancel}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={onPrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onPrintPreview}>
              <Printer className="mr-2 h-4 w-4" />
              Print Preview
            </Button>
            <Button variant="outline" onClick={onThermalPrintPreview}>
              Thermal Print
            </Button>
            <Button className="col-span-2">Checkout</Button>
          </>
        )}
      </div>
    </CardFooter>
  );
};
