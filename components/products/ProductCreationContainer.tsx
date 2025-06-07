'use client';

import { useUser } from '@/lib/hooks/useUser';
import { ProductForm } from '@/components/ProductForm';
import { ProductHeader } from './ProductHeader';
import { AccessDenied } from '@/components/ui/access-denied';
import { ProductFormSkeleton } from '@/components/skeletons/product-form-skeleton';

export function ProductCreationContainer() {
  const { user, loading, isAdmin, isSales } = useUser();

  if (loading) {
    return <ProductFormSkeleton />;
  }

  if (!user) {
    return <AccessDenied message="Please log in to access this page" />;
  }

  const canCreateProducts = isAdmin || isSales;
  
  if (!canCreateProducts) {
    return (
      <AccessDenied 
        message="You don't have permission to create products" 
        showHomeButton 
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col space-y-6 p-6 max-w-7xl mx-auto">
      <ProductHeader 
        title="Create New Product" 
        subtitle="Add a new product to your inventory"
      />
      <ProductForm 
        isAdmin={isAdmin}
        isSales={isSales}
      />
    </div>
  );
}
