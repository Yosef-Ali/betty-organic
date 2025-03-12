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
 * @param orderId - The raw order ID
 * @returns Formatted order ID with # prefix
 */
export const formatOrderId = (orderId: string) => {
  // Remove any existing # prefix
  const cleanId = orderId.replace('#', '');
  // Ensure the ID is exactly 8 characters, pad with zeros if needed
  const paddedId = cleanId.padStart(8, '0');
  // Return with # prefix
  return `#${paddedId}`;
};
