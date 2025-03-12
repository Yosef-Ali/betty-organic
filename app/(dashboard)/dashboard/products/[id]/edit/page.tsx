import { ProductForm } from '@/components/ProductForm';
import { ProductHeader } from '@/components/products/ProductHeader';
import { getProduct } from '@/app/actions/productActions';
import { ProductCategory } from '@/types/supabase';

interface ProductEditPageProps {
  params: { id: string };
}

export default async function ProductEditPage({
  params: { id },
}: ProductEditPageProps) {
  const product = await getProduct(id);

  return (
    <div className="flex-1 flex flex-col space-y-4 p-8">
      <ProductHeader title="Edit Product" />
      <div className="grid gap-4">
        <ProductForm
          initialData={
            product
              ? {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                status: product.active ? 'active' : 'out_of_stock',
                stock: Number(product.stock),
                description: product.description || undefined,
                imageUrl: product.imageUrl || undefined,
                category: (product.category as ProductCategory) || 'All',
              }
              : undefined
          }
          isAdmin={true} // TODO: Pass actual user role
          isSales={true} // TODO: Pass actual user role
        />
      </div>
    </div>
  );
}
