'use client'

import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { PlusCircle, Download, Pencil, Trash } from "lucide-react"
import { useState } from "react"
import { Product } from "@/lib/supabase/db.types"
import { Row } from '@tanstack/react-table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { deleteProduct } from "@/app/actions/productActions"
import { Image } from 'next/image'

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
  }).format(price)
}

// Define columns for the data table
const columns = [
  {
    accessorKey: "imageUrl",
    header: "Image",
    cell: ({ row }: { row: Row<Product> }) => (
      <div className="relative w-10 h-10">
        <Image
          src={row.original.imageUrl || '/placeholder-product.jpg'}
          alt={row.original.name}
          className="w-full h-full object-cover rounded-md"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/placeholder-product.jpg';
          }}
        />
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }: { row: Row<Product> }) => formatPrice(row.original.price),
  },
  {
    accessorKey: "stock",
    header: "Stock",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }: { row: Row<Product> }) => (
      <Badge variant={row.original.active ? "default" : "secondary"}>
        {row.original.active ? 'Active' : 'Inactive'}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }: { row: Row<Product> }) => {
      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/products/${row.original.id}/edit`)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <DeleteProductButton id={row.original.id} />
        </div>
      );
    },
  },
]

function DeleteProductButton({ id }: { id: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter() // Initialize router here

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const result = await deleteProduct(id)
      if (result.success) {
        toast({
          title: "Product deleted",
          description: "The product has been successfully deleted.",
        })
        router.refresh()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the product",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ProductsTable({ products }: { products: Product[] }) {
  const router = useRouter()
  const [filterValue, setFilterValue] = useState("")

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(filterValue.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Manage your products inventory and details
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              size="sm"
              onClick={() => router.push('/dashboard/products/new')}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            placeholder="Filter products..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <DataTable
          columns={columns}
          data={filteredProducts}
          searchKey="name"
        />
      </CardContent>
    </Card>
  )
}
