import React from "react";
import { CartItemType } from "@/types/cart";

export interface CustomerInfo {
    name: string;
    phone: string;
    address: string;
}

export interface OrderDetails {
    id: string;
    display_id: string;
    items: Array<{
        name: string;
        grams: number;
        price: number;
        unit_price: number;
    }>;
    total: number;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    customer_email?: string | null;
    user_id?: string | null;
    created_at: string;
}

export interface ConfirmPurchaseDialogProps {
    isOpen: boolean;
    onCloseAction: () => void;
    items: CartItemType[];
    total: number;
    customerInfo?: {
        name: string;
        phone: string;
        address: string;
    };
}

// Common form props shared by all forms
interface CommonFormProps {
    items: CartItemType[];
    total: number;
    customerInfo: CustomerInfo;
    setCustomerInfoAction: React.Dispatch<React.SetStateAction<CustomerInfo>>;
    isSubmitting: boolean;
    handleConfirmAction: () => void;
    onCancelAction: () => void;
    isCustomerInfoValidAction: () => boolean;
}


// GuestForm props
export interface GuestFormProps extends CommonFormProps {
    handleSignInAction: () => void; // Name matches how it's called in the dialog
    handleDirectOrderAction?: () => void; // New prop for direct order submission
}

// AuthenticatedForm props
export interface AuthenticatedFormProps {
    items: CartItemType[];
    total: number;
    customerInfo: CustomerInfo;
    setCustomerInfoAction: React.Dispatch<React.SetStateAction<CustomerInfo>>;
    isSubmitting: boolean;
    handleConfirmAction: () => void;
    onCancelAction: () => void;
    isCustomerInfoValidAction: () => boolean;
    profileData: any;
    userEmail: string | null;
}

export interface OrderPlacedProps {
    isAuthenticated: boolean;
    orderDetails: OrderDetails;
    customerInfo: CustomerInfo;
    handleShareWhatsApp: () => void;
    handleSignIn: () => void;
    onClose: () => void;
}
