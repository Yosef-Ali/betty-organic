import { FC, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, CheckCircle2, Save, Phone } from "lucide-react";
import { toast } from "sonner";
import { updateCustomerPhone } from "@/app/actions/customerActions";

interface CustomerPhoneInputProps {
  customerId: string;
  currentPhone: string;
  customerName: string;
  onPhoneUpdated: (newPhone: string) => void;
}

export const CustomerPhoneInput: FC<CustomerPhoneInputProps> = ({
  customerId,
  currentPhone,
  customerName,
  onPhoneUpdated,
}) => {
  const [phone, setPhone] = useState(currentPhone);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Validation function
  const validatePhone = (phoneNumber: string) => {
    if (!phoneNumber) return "Phone number is required";
    if (!/^\+251\d{9}$/.test(phoneNumber)) {
      return "Please enter a valid Ethiopian phone number (+251xxxxxxxxx)";
    }
    return null;
  };

  const handlePhoneChange = useCallback((value: string) => {
    setPhone(value);
    setHasChanges(value !== currentPhone);
  }, [currentPhone]);

  const handleSavePhone = useCallback(async () => {
    const validation = validatePhone(phone);
    if (validation) {
      toast.error(validation);
      return;
    }

    setIsUpdating(true);
    try {
      const result = await updateCustomerPhone(customerId, phone);
      
      if (result.success) {
        toast.success(`Phone number updated for ${customerName}`, {
          description: `WhatsApp receipts can now be sent to ${phone}`
        });
        onPhoneUpdated(phone);
        setHasChanges(false);
      } else {
        toast.error("Failed to update phone number", {
          description: result.error
        });
      }
    } catch (error) {
      console.error('Error updating customer phone:', error);
      toast.error("Error updating phone number", {
        description: "Please try again"
      });
    } finally {
      setIsUpdating(false);
    }
  }, [customerId, phone, customerName, onPhoneUpdated]);

  const phoneError = phone ? validatePhone(phone) : null;
  const isValid = !phoneError && phone.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Add phone number to enable WhatsApp receipts for {customerName}
        </span>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="flex">
            <div className="flex items-center px-3 border rounded-l bg-muted/50 border-input border-r-0">
              <span className="text-sm text-muted-foreground">+251</span>
            </div>
            <Input
              type="tel"
              placeholder="9XXXXXXXX"
              value={phone?.replace("+251", "") || ""}
              onChange={(e) => {
                const numbers = e.target.value.replace(/\D/g, "");
                const newPhone = numbers ? `+251${numbers}` : "";
                handlePhoneChange(newPhone);
              }}
              className={`rounded-l-none ${
                phone
                  ? phoneError
                    ? "border-red-500 focus:border-red-500"
                    : "border-green-500 focus:border-green-500"
                  : ""
              }`}
              maxLength={9}
              disabled={isUpdating}
            />
          </div>
          
          {phone && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {phoneError ? (
                <AlertCircle className="h-4 w-4 text-red-500" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              )}
            </div>
          )}
        </div>
        
        <Button
          onClick={handleSavePhone}
          disabled={!hasChanges || !!phoneError || isUpdating || !phone}
          size="sm"
          className="gap-2"
        >
          {isUpdating ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {isUpdating ? "Saving..." : "Save"}
        </Button>
      </div>
      
      {phoneError && phone && (
        <p className="text-xs text-red-600">{phoneError}</p>
      )}
      
      {isValid && (
        <p className="text-xs text-green-600">
          ✅ Valid Ethiopian phone number - Ready for WhatsApp receipts
        </p>
      )}
      
      <p className="text-xs text-muted-foreground">
        Enter the customer&apos;s WhatsApp number to enable automatic receipt sending
      </p>
    </div>
  );
};