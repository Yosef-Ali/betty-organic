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
 * Formats currency amounts that may be stored in cents in the database
 * This function handles the conversion from cents to main currency unit
 * @param amount The amount (possibly in cents)
 * @returns Formatted currency string in Birr
 */
export function formatOrderCurrency(amount: number): string {
  // Convert from cents to main currency unit if the amount seems to be in cents
  // We use a threshold to detect if the amount is likely in cents vs main currency unit
  // If the amount is > 10000 (100.00 ETB in cents), it's likely stored in cents
  // This avoids converting legitimate amounts like 1000 ETB (which should stay as 1000 ETB)
  const displayAmount = amount > 10000 ? amount / 100 : amount;
  
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    currencyDisplay: 'narrowSymbol',
  })
    .format(displayAmount)
    .replace('ETB', 'Br.');
}

/**
 * Formats an order ID for display
 * If it's a display_id (BO-YYYYMMDD-XXXX format), returns it as is
 * If it's a UUID, returns a shortened version
 * @param id The order ID to format
 * @returns string The formatted order ID
 */
export function formatOrderId(id: string): string {
  if (!id) return 'N/A';

  // If it's already in the BO-YYYYMMDD-XXXX format, return as is
  if (id.startsWith('BO-')) {
    return id;
  }

  // For UUIDs, return a shortened version
  return `#${id.slice(0, 8)}`;
}

/**
 * Checks if an order ID is in the display ID format
 * @param orderId - The order ID to check
 * @returns boolean indicating if it's a display ID
 */
export const isDisplayOrderId = (orderId: string): boolean => {
  return /^BO-\d{8}-\d{4}$/.test(orderId);
};
