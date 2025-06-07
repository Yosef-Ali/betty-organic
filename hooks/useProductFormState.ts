'use client';

import { useState, useCallback } from 'react';
import { ProductFormValues } from '@/components/products/ProductFormSchema';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function useProductFormState() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateBusinessRules = useCallback((data: ProductFormValues): ValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Business rule validations
    if (data.price > 10000) {
      errors.push('Price cannot exceed 10,000 ETB for organic products');
    }

    if (data.price > 500) {
      warnings.push('High-priced item - consider adding detailed description');
    }

    if (data.stock > 1000) {
      errors.push('Stock cannot exceed 1,000 units');
    }

    if (data.stock < 5 && data.price > 50) {
      warnings.push('Low stock for high-value item - consider restocking');
    }

    if (data.name && data.name.toLowerCase().includes('test')) {
      errors.push('Product name cannot contain "test" in production');
    }

    // Category-specific validations
    if (data.category === 'Eggs_Dairy_products') {
      if (data.stock > 100) {
        errors.push('Dairy products stock should not exceed 100 units due to perishability');
      }
      if (data.stock > 50) {
        warnings.push('Consider reducing dairy stock due to shorter shelf life');
      }
    }

    if (data.category === 'Flowers' && data.stock > 200) {
      warnings.push('High flower stock - ensure proper storage conditions');
    }

    // Price validation by category
    const categoryPriceRanges = {
      'Vegetables': { min: 0.5, max: 20 },
      'Fruits': { min: 1, max: 30 },
      'Herbs_Lettuce': { min: 1, max: 15 },
      'Eggs_Dairy_products': { min: 2, max: 50 },
      'Flowers': { min: 5, max: 100 },
    };

    const priceRange = categoryPriceRanges[data.category as keyof typeof categoryPriceRanges];
    if (priceRange) {
      if (data.price < priceRange.min) {
        warnings.push(`Price seems low for ${data.category.replace(/_/g, ' ')} (typical range: ${priceRange.min}-${priceRange.max} ETB)`);
      }
      if (data.price > priceRange.max) {
        warnings.push(`Price seems high for ${data.category.replace(/_/g, ' ')} (typical range: ${priceRange.min}-${priceRange.max} ETB)`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, []);

  const calculateEstimatedValue = useCallback((data: ProductFormValues): number => {
    return data.price * data.stock;
  }, []);

  const suggestOptimalStock = useCallback((data: ProductFormValues): number => {
    const categoryOptimalStock = {
      'Vegetables': 50,
      'Fruits': 40,
      'Herbs_Lettuce': 30,
      'Eggs_Dairy_products': 25,
      'Flowers': 60,
      'Spices_Oil_Tuna': 100,
      'Dry_Stocks_Bakery': 150,
      'All': 75,
    };

    return categoryOptimalStock[data.category as keyof typeof categoryOptimalStock] || 75;
  }, []);

  return {
    isSubmitting,
    setIsSubmitting,
    validateBusinessRules,
    calculateEstimatedValue,
    suggestOptimalStock,
  };
}
