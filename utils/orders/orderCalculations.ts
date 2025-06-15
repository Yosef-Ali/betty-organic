// utils/orders/orderCalculations.ts
import type { OrderItem, ExtendedOrder } from "@/types/order";

export interface OrderCalculation {
    subtotal: number;
    deliveryCost: number;
    discountAmount: number;
    totalAmount: number;
    items: Array<{
        name: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
}

/**
 * Universal order calculation utility that ensures consistency across the app
 * Based on the logic from OrderDetailsCard.tsx
 */
export function calculateOrderTotals(order: ExtendedOrder): OrderCalculation {
    // Process items with safe type checking  
    const itemsWithTotal = (order.order_items || order.items || []).map((item) => ({
        ...item,
        total: Number(item.price || 0), // item.price is already the total for this line item
    }));

    // Calculate subtotal from items
    const subtotal = itemsWithTotal.reduce((sum, item) => sum + item.total, 0);

    // Get discount with fallback
    const discountAmount = order.discount_amount || 0;

    // --- Adjusted Delivery Cost Calculation ---
    // Prioritize explicitly provided delivery_cost if > 0
    // Otherwise, infer it from the difference between db total and subtotal (minus discount)
    let inferredDeliveryCost = 0;
    if (order.total_amount && order.total_amount > (subtotal - discountAmount)) {
        inferredDeliveryCost = order.total_amount - subtotal + discountAmount;
    }
    const deliveryCost = (order.delivery_cost && order.delivery_cost > 0) ? order.delivery_cost : inferredDeliveryCost;

    // Calculate the correct total amount including delivery and discount
    const calculatedTotal = subtotal + deliveryCost - discountAmount;

    // Use the database total_amount as the primary source of truth if available, otherwise use calculated
    const totalAmount = order.total_amount || calculatedTotal;

    // Format items for invoice
    const items = itemsWithTotal.map((item) => ({
        name: item.product_name || item.product?.name || 'Unknown Item',
        quantity: item.quantity || 1,
        unitPrice: item.quantity ? (item.total / item.quantity) : item.total,
        totalPrice: item.total
    }));

    return {
        subtotal,
        deliveryCost,
        discountAmount,
        totalAmount,
        items
    };
}

/**
 * Calculate totals for cart items (marketing cart)
 */
export function calculateCartTotals(items: Array<{
    name: string;
    pricePerKg: number;
    grams: number;
}>): { subtotal: number; totalAmount: number; items: Array<{ name: string; quantity: number; unitPrice: number; totalPrice: number; }> } {
    const processedItems = items.map(item => {
        const totalPrice = (item.pricePerKg * item.grams) / 1000;
        return {
            name: item.name,
            quantity: item.grams / 1000, // Convert to kg
            unitPrice: item.pricePerKg,
            totalPrice
        };
    });

    const subtotal = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);

    return {
        subtotal,
        totalAmount: subtotal, // For cart, total equals subtotal (no delivery/discount yet)
        items: processedItems
    };
}
