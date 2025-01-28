import { Suspense } from 'react';
import { ProductForm } from '@/components/ProductForm';
import { Metadata } from 'next';
import { isUserAdmin, isSalesUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Add New Product',
  description: 'Create a new product',
};

function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default async function AddProductPage() {
  const [isAdmin, isSales] = await Promise.all([isUserAdmin(), isSalesUser()]);

  // If user doesn't have required permissions, redirect to dashboard
  if (!isAdmin && !isSales) {
    redirect('/dashboard');
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <ProductForm isAdmin={isAdmin} isSales={isSales} />
      </div>
    </Suspense>
  );
}
