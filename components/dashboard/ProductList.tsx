// app/products/ProductList.tsx

'use client'

import { useState } from 'react'
import { Product as PrismaProduct } from '@prisma/client'
import { useRouter } from 'next/navigation'

// Extend the Prisma Product type to make totalSales optional
type Product = Omit<PrismaProduct, 'totalSales'> & { totalSales?: number, status: string }

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal } from 'lucide-react'
import { deleteProduct, updateProduct } from '@/app/actions/productActions'
import { Card, CardContent } from '../ui/card'
import ProductsHeader from './ProductHeader'

// Update the props and state type
interface ProductListProps {
  initialProducts: Product[]
}

export default function ProductList({ initialProducts }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    await deleteProduct(id)
    setProducts(products.filter(p => p.id !== id))
  }

  const handleEdit = (id: string) => {
    router.push(`/products/edit/${id}`)
    console.log('Edit product with id:', id)
  }

  return (
    <Card x-chunk="dashboard-06-chunk-0">
      <ProductsHeader />
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden sm:table-cell">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total Sales</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="hidden sm:table-cell">
                  <img
                    alt="Product image"
                    className="aspect-square rounded-md object-cover"
                    height="64"
                    src={product.imageUrl ?? ''}
                    width="64"
                  />
                </TableCell>
                <TableCell>{product.name}</TableCell>
                <TableCell>
                  <Badge variant={product.status.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>{product.totalSales ?? 0}</TableCell>
                <TableCell>
                  <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                    {product.stock}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(product.createdAt).toLocaleString()}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEdit(product.id)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(product.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
