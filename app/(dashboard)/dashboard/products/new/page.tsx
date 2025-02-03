import { ProductForm } from '@/components/ProductForm';
import { ProductHeader } from '@/components/products/ProductHeader';

export default function NewProductPage() {
  return (
    <div className="flex-1 flex flex-col space-y-4 p-8">
      <ProductHeader title="New Product" />
      <div className="grid gap-4">
        <ProductForm
          isAdmin={true} // TODO: Pass actual user role
          isSales={true} // TODO: Pass actual user role
        />
      </div>
    </div>
  );
}
