import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { ProductSection } from "./client/ProductSection";
import { Database } from "@/lib/database.types";

export async function ProductWrapper() {
  const supabase = createServerComponentClient<Database>({ cookies });

  try {
    const { data: rawProducts } = await supabase
      .from('products')
      .select('*')
      .order('name');

    // Convert all data to plain objects with primitive values
    const products = (rawProducts ?? []).map(product => ({
      id: String(product.id),
      name: String(product.name),
      price: Number(product.price),
      imageUrl: product.imageUrl ? String(product.imageUrl) : '',
      description: product.description ? String(product.description) : '',
      unit: String(product.unit || 'kg')
    }));

    // Pass the serialized data to the client component
    return <ProductSection initialProducts={products} />;
  } catch (error) {
    console.error('Error fetching products:', error);
    return <div>Error loading products</div>;
  }
}
