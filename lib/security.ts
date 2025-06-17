// Security utilities for the Betty Organic App

import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

// Rate limiting configuration
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Simple in-memory rate limiter (use Redis in production)
class MemoryRateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(identifier: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    const windowStart = now - config.windowMs;
    
    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || [];
    
    // Filter out requests outside the current window
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    // Check if under the limit
    if (validRequests.length >= config.maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const [key, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(t => now - t < oneHour);
      if (validTimestamps.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validTimestamps);
      }
    }
  }
}

export const rateLimiter = new MemoryRateLimiter();

// Periodic cleanup
setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000); // Every 5 minutes

// Input validation utilities
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return '';
  return input.trim().replace(/[<>]/g, '');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePrice(price: number): boolean {
  return typeof price === 'number' && price >= 0 && price <= 100000;
}

export function validateQuantity(quantity: number): boolean {
  return typeof quantity === 'number' && quantity >= 0 && quantity <= 10000 && Number.isInteger(quantity);
}

// Security headers helper
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)'
  };
}

// Get client IP address
export function getClientIP(request?: NextRequest): string {
  if (request) {
    return request.ip || 
           request.headers.get('x-forwarded-for')?.split(',')[0] || 
           request.headers.get('x-real-ip') || 
           'unknown';
  }
  
  // For server components
  const headersList = headers();
  return headersList.get('x-forwarded-for')?.split(',')[0] || 
         headersList.get('x-real-ip') || 
         'unknown';
}

// API rate limiting
export const API_RATE_LIMITS = {
  STRICT: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 requests per minute
  MODERATE: { windowMs: 60 * 1000, maxRequests: 60 }, // 60 requests per minute
  LENIENT: { windowMs: 60 * 1000, maxRequests: 300 }, // 300 requests per minute
};
