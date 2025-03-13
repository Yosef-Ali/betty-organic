import { createClient } from '@/lib/supabase/server';
import { ProductSection } from '@/components/products/product-section';

export const revalidate = 3600; // Revalidate every hour

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('createdat', { ascending: false });

  return <ProductSection initialProducts={products || []} />;
}
