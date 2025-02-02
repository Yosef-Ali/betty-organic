import { DashboardShell } from '@/components/DashboardShell';
import { ProductForm } from '@/components/ProductForm';

export default function NewProductPage() {
  return (
    <DashboardShell>
      <div className="flex-1 flex flex-col space-y-4 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">New Product</h1>
        </div>
        <div className="grid gap-4">
          <ProductForm
            isAdmin={true} // TODO: Pass actual user role
            isSales={true} // TODO: Pass actual user role
          />
        </div>
      </div>
    </DashboardShell>
  );
}
