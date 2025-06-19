import { CustomerInfo } from "./types";

// Format phone number to international Ethiopian format
export const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('251')) {
        return `+${cleaned}`;
    } else if (cleaned.startsWith('0')) {
        return `+251${cleaned.slice(1)}`;
    }
    return `+251${cleaned}`;
};

// Update customer info field
export const createInfoChangeHandler =
    (field: keyof CustomerInfo, setCustomerInfo: React.Dispatch<React.SetStateAction<CustomerInfo>>) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setCustomerInfo(prev => ({
                ...prev,
                [field]: e.target.value,
            }));
        };

// Save cart to localStorage before sign-in
export const saveCartToLocalStorage = (
    items: any[],
    customerInfo: CustomerInfo
) => {
    localStorage.setItem(
        'pendingCart',
        JSON.stringify({
            items,
            customerInfo,
            timestamp: Date.now(),
        })
    );
};

// Validate customer info based on authentication state
export const validateCustomerInfo = (
    isAuthenticated: boolean,
    customerInfo: CustomerInfo
): boolean => {
    // Both authenticated and guest users need phone and address
    const hasValidPhone = !!(customerInfo.phone && customerInfo.phone.trim().length >= 9);
    const hasValidAddress = !!(customerInfo.address && customerInfo.address.trim().length >= 5);

    return hasValidPhone && hasValidAddress;
};
