import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    currencyDisplay: 'narrowSymbol',
  })
    .format(amount)
    .replace('ETB', 'Br.');
}

/**
 * Formats an order ID to ensure consistent display across the application
 * @param orderId - Either a display ID (BO-YYYYMMDD-XXXX) or internal UUID
 * @returns Formatted order ID
 */
export const formatOrderId = (orderId: string) => {
  // If it's already in our display ID format (BO-YYYYMMDD-XXXX), return as is
  if (orderId.startsWith('BO-') && orderId.length === 15) {
    return orderId;
  }

  // For legacy or internal IDs, format with # prefix and padding
  const cleanId = orderId.replace('#', '');
  const paddedId = cleanId.slice(-8).padStart(8, '0');
  return `#${paddedId}`;
};

/**
 * Checks if an order ID is in the display ID format
 * @param orderId - The order ID to check
 * @returns boolean indicating if it's a display ID
 */
export const isDisplayOrderId = (orderId: string): boolean => {
  return /^BO-\d{8}-\d{4}$/.test(orderId);
};
