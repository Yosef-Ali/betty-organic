import { ProductCreationContainer } from '@/components/products/ProductCreationContainer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Product | Betty Organic',
  description: 'Create a new product in your organic store inventory',
};

export default function NewProductPage() {
  return <ProductCreationContainer />;
}
