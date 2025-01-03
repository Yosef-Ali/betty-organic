import Image from 'next/image'
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database } from '@/lib/supabase'

type Product = Database['public']['Tables']['products']['Row']

type ProductCardProps = {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-4">
        <Image
          src={product.imageUrl}
          alt={product.name}
          width={300}
          height={200}
          className="w-full h-48 object-cover mb-4 rounded"
        />
        <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
        <p className="font-bold">${product.price.toFixed(2)}</p>
        <p className="text-sm">Stock: {product.stock}</p>
        <p className="text-sm">Total Sales: {product.totalSales}</p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => onEdit(product)}>Edit</Button>
        <Button variant="destructive" onClick={() => onDelete(product.id)}>Delete</Button>
      </CardFooter>
    </Card>
  )
}

