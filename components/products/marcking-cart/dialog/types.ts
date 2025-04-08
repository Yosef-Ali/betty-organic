import { CartItemType } from "@/types/cart";

export interface CustomerInfo {
    name: string;
    phone: string;
    address: string;
}

export interface ConfirmPurchaseDialogProps {
    isOpen: boolean;
    onCloseAction: () => void;
    items: CartItemType[];
    total: number;
}

export interface OrderDetailsItem {
    name: string;
    grams: number;
    price: number;
    unit_price: number;
}

export interface OrderDetails {
    id: string;
    display_id: string;
    items: OrderDetailsItem[];
    total: number;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    customer_email?: string | null;
    user_id?: string | null;
    created_at: string;
}

export interface FormProps {
    items: CartItemType[];
    total: number;
    customerInfo: CustomerInfo;
    setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>;
    isSubmitting: boolean;
    handleConfirm: () => void;
    handleSignIn?: () => void;
    onCancel: () => void;
    isCustomerInfoValid: () => boolean;
}

export interface OrderPlacedProps {
    isAuthenticated: boolean;
    orderDetails: OrderDetails;
    customerInfo: CustomerInfo;
    handleShareWhatsApp: () => void;
    handleSignIn: () => void;
    onClose: () => void;
}
