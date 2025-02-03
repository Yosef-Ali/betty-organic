import { Suspense } from 'react';
import ProductTable from '@/components/products/ProductTable';

export default async function ProductsPage() {
  return (
    <div className="flex-1 space-y-4  pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your product catalog and inventory
          </p>
        </div>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading products...</div>
          </div>
        }
      >
        <ProductTable />
      </Suspense>
    </div>
  );
}
