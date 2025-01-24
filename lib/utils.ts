export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
import { clsx, type ClassValue } from 'clsx';
import ms from 'ms';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LogAuthEventParams {
  message: string;
  metadata?: {
    url?: string;
    error?: string;
    path?: string;
    user?: string;
    [key: string]: unknown;
  };
  level?: 'info' | 'warn' | 'error';
}

export function logAuthEvent(
  message: string,
  params?: Omit<LogAuthEventParams, 'message'>,
) {
  const { metadata = {}, level = 'info' } = params || {};
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    level,
    message,
    ...metadata,
  };

  if (process.env.NODE_ENV === 'development') {
    console[level](`[Auth] ${message}`, logEntry);
  }

  // In production, this could be extended to send logs to a logging service
  // For now, we'll just use console logging
}

export const timeAgo = (timestamp: Date, timeOnly?: boolean): string => {
  if (!timestamp) return 'never';
  return `${ms(Date.now() - new Date(timestamp).getTime())}${
    timeOnly ? '' : ' ago'
  }`;
};
