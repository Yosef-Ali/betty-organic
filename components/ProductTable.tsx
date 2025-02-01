'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { PlusCircle, MoreHorizontal, ListFilter, File } from 'lucide-react'
import { getProducts, deleteProduct } from '@/app/actions/productActions'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useToast } from '@/hooks/use-toast'
import { Product } from '@/types/product'; // Import Product type directly from product.ts
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

import { formatDistanceToNow, isValid } from 'date-fns'

// Helper function for safe date formatting
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  if (!dateString) return 'N/A';
  try {
    const date = dateString ? new Date(dateString) : null;
    if (!date || !isValid(date)) return 'Invalid date';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

const ProductTableContent = ({ products, isLoading, onDelete, statusFilter }: {
  products: Product[]
  isLoading: boolean
  onDelete: (id: string) => Promise<void>
  statusFilter: 'all' | 'active' | 'out-of-stock'
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const filteredProducts = products.filter(product => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return product.stock > 0;
    if (statusFilter === 'out-of-stock') return product.stock === 0;
    return true;
  });

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center">
          Loading...
        </TableCell>
      </TableRow>
    )
  }

  if (products.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={7} className="h-24 text-center">
          No products found.
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {filteredProducts.map((product: Product) => (
        <TableRow key={product.id}>
          <TableCell className="hidden sm:table-cell">
            <Image
              alt={`${product.name} image`}
              className="aspect-square rounded-md object-cover"
              height={64}
              width={64}
              src={product.imageUrl || '/placeholder.svg'}
            />
          </TableCell>
          <TableCell className="font-medium">
            {product.name}
          </TableCell>
          <TableCell className="hidden xs:table-cell">
            {product.price.toFixed(2)} Br
          </TableCell>
          <TableCell className="hidden md:table-cell">
            {product.stock}
          </TableCell>
          <TableCell>
            <Badge variant={product.stock > 0 ? "default" : "destructive"}>
              {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
            </Badge>
          </TableCell>
          <TableCell className="hidden lg:table-cell">
            {formatDate(product.updatedAt)}
          </TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => router.push(`/dashboard/products/${product.id}`)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {product.name}. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(product.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

const ProductTable = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'out-of-stock'>('all')
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      const data = await getProducts()
      // Transform the data to match the Product interface
      const transformedProducts: Product[] = data.map(product => ({
        ...product,
        stock: product.stock ?? 0, // Default to 0 if stock is null
        totalSales: 0, // Set a default value for totalSales
        imageUrl: product.imageUrl || '/placeholder-product.png', // Provide default image URL
        createdAt: product.createdat || new Date().toISOString(),
        updatedAt: product.updatedat || new Date().toISOString(),
        active: product.active ?? true, // Default to true if null
        category: product.category || 'Uncategorized', // Default category
        created_by: product.created_by || 'system', // Default creator
      }))
      setProducts(transformedProducts)
    } catch (error) {
      console.error('Error loading products:', error)
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id)
      toast({
        title: 'Success',
        description: 'Product deleted successfully.',
      })
      loadProducts() // Reload the products list
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const filteredProducts = products.filter(product => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return product.stock > 0;
    if (activeTab === 'out-of-stock') return product.stock === 0;
    return true;
  });

  const renderTable = (products: Product[]) => (
    <div className="w-full overflow-hidden">
      <div className="w-full overflow-x-auto">
        <div className="min-w-[800px] rounded-md border px-2 pb-2 sm:px-4 sm:pb-4 relative">
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background via-background/80 to-transparent pointer-events-none hidden sm:block" />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden md:table-cell">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Price</TableHead>
                <TableHead className="hidden md:table-cell">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <ProductTableContent
                products={products}
                isLoading={isLoading}
                onDelete={handleDelete}
                statusFilter={activeTab}
              />
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )

  return (
    <div className="h-full flex-1 flex-col space-y-8 md:p-4">
      <Tabs defaultValue="all" className="space-y-4" onValueChange={(value: any) => setActiveTab(value)}>
        <div className="flex flex-wrap items-center justify-between gap-y-2">
          <TabsList className="flex-wrap gap-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm px-2 sm:px-3">All Products</TabsTrigger>
            <TabsTrigger value="active" className="text-xs sm:text-sm px-2 sm:px-3">Active</TabsTrigger>
            <TabsTrigger value="out-of-stock" className="text-xs sm:text-sm px-2 sm:px-3">Out of Stock</TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search products..."
              className="h-8 w-[150px] lg:w-[250px]"
              value=""
              onChange={(e) => { }}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-2 lg:px-3">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filter
                  <File className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={activeTab === 'active'} onCheckedChange={(checked) => setActiveTab(checked ? 'active' : 'all')}>Active</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={activeTab === 'out-of-stock'} onCheckedChange={(checked) => setActiveTab(checked ? 'out-of-stock' : 'all')}>Out of Stock</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={() => router.push('/dashboard/products/new')}>
                      <PlusCircle className="sm:mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Add Product</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="sm:hidden">
                    <p>Add New Product</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Products</CardTitle>
              <CardDescription>View and manage all your products.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(filteredProducts)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="out-of-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Out of Stock Products</CardTitle>
              <CardDescription>View and manage products that are currently out of stock.</CardDescription>
            </CardHeader>
            <CardContent>
              {renderTable(filteredProducts)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ProductTable;
