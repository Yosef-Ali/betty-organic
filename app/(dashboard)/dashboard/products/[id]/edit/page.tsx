import { DashboardShell } from '@/components/DashboardShell';
import { ProductForm } from '@/components/ProductForm';
import { getProduct } from '@/app/actions/productActions';

interface ProductEditPageProps {
  params: { id: string };
}

export default async function ProductEditPage({
  params: { id },
}: ProductEditPageProps) {
  const product = await getProduct(id);

  return (
    <DashboardShell>
      <div className="flex-1 flex flex-col space-y-4 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
        </div>
        <div className="grid gap-4">
          <ProductForm
            initialData={product}
            isAdmin={true} // TODO: Pass actual user role
            isSales={true} // TODO: Pass actual user role
          />
        </div>
      </div>
    </DashboardShell>
  );
}
