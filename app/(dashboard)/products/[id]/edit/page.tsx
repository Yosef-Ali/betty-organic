
import { getProduct } from '@/app/actions/productActions'
import { ProductForm } from '@/components/ProductForm'

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await getProduct(params.id)

  if (!product) {
    return <div>Product not found</div>
  }

  // Add status field with a correct type
  const productWithStatus = {
    ...product,
    status: (product.stock > 0 ? "active" : "out_of_stock") as "active" | "out_of_stock"
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Edit Product</h2>
      <ProductForm initialData={{
        ...productWithStatus,
        description: productWithStatus.description || undefined
      }} />
    </div>
  )
}
