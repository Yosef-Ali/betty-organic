import { Suspense } from 'react';
import { ProductForm } from '@/components/ProductForm';
import { Metadata } from 'next';
import { isUserAdmin, isSalesUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { getProduct } from '@/app/actions/productActions';

export const metadata: Metadata = {
  title: 'Edit Product',
  description: 'Edit product details',
};

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

interface Props {
  params: {
    id: string;
  };
}

export default async function EditProductPage({ params }: Props) {
  const [isAdmin, isSales, product] = await Promise.all([
    isUserAdmin(),
    isSalesUser(),
    getProduct(params.id),
  ]);

  // If user doesn't have required permissions, redirect to dashboard
  if (!isAdmin && !isSales) {
    redirect('/dashboard');
  }

  // If product not found, redirect to products page
  if (!product) {
    redirect('/dashboard/products');
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <ProductForm
          initialData={product}
          isAdmin={isAdmin}
          isSales={isSales}
        />
      </div>
    </Suspense>
  );
}
