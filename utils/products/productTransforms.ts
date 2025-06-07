// utils/products/productTransforms.ts
import type { ProductWithStatus, ProductAPIResponse } from '@/components/SalesPage';

/**
 * Transforms raw product data from API to UI-ready product with status
 */
export function transformProductData(rawProduct: any): ProductWithStatus {
  return {
    id: rawProduct.id,
    name: rawProduct.name,
    description: rawProduct.description,
    price: rawProduct.price ?? 0,
    stock: rawProduct.stock ?? 0,
    imageUrl: rawProduct.imageUrl || '/placeholder-product.svg',
    category: rawProduct.category || 'Uncategorized',
    active: rawProduct.active ?? true,
    totalSales: rawProduct.totalsales ?? 0,
    createdAt: rawProduct.createdat || new Date().toISOString(),
    updatedAt: rawProduct.updatedat || new Date().toISOString(),
    status: (rawProduct.stock ?? 0) > 0 ? 'Available' : 'Out of Stock',
  };
}

/**
 * Transforms multiple products and filters for active, available items
 */
export function transformAndFilterProducts(rawProducts: any[]): ProductWithStatus[] {
  return rawProducts
    .map(transformProductData)
    .filter(product => product.active !== false)
    .filter(product => product.status === 'Available');
}

/**
 * Converts a product to a cart item format
 */
export function productToCartItem(product: ProductWithStatus) {
  return {
    id: product.id,
    name: product.name,
    imageUrl: product.imageUrl || '/placeholder-product.svg',
    pricePerKg: product.price,
    grams: product.stock > 0 ? 1000 : 100,
    unit: 'kg' as const,
  };
}
