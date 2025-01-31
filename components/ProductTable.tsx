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
    return true; // Default to showing all if filter is not recognized
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
      {products.map((product: Product) => (
        <TableRow key={product.id}>
          <TableCell className="hidden sm:table-cell">
            <Image
              alt={`${product.name} image`}
              className="aspect-square rounded-md object-cover"
              height={64}
              src={product.imageUrl || '/placeholder-product.png'}
              width={64}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-product.png';
              }}
            />
          </TableCell>
          <TableCell className="font-medium">{product.name}</TableCell>
          <TableCell>
            <Badge variant={product.stock > 0 ? "outline" : "secondary"}>
              {product.stock > 0 ? "Active" : "Out of Stock"}
            </Badge>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            Br {product.price.toFixed(2)}
          </TableCell>
          <TableCell className="hidden md:table-cell">
            {product.totalSales} {/* Display totalSales */}
          </TableCell>
          <TableCell className="hidden md:table-cell">
            {formatDate(product.createdAt)}
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => router.push(`/dashboard/products/${product.id}/edit`)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="w-full text-left">Delete</button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the product.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            setDeletingId(product.id);
                            await onDelete(product.id);
                            setDeletingId(null);
                          }}
                          disabled={deletingId === product.id}
                        >
                          {deletingId === product.id ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </>
  )
}

export function ProductTable() {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'out-of-stock'>('all');

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProducts(filtered)
  }, [searchTerm, products])

  async function fetchProducts() {
    setIsLoading(true)
    try {
      const fetchedProducts = await getProducts();
      const mappedProducts = fetchedProducts.map(product => ({
        ...product,
        createdAt: product.createdat || '',
        updatedAt: product.updatedat || '',
        imageUrl: product.imageUrl || '', // Ensure imageUrl is a string
        totalSales: 0,
        // Ensure required fields have non-null values
        stock: product.stock ?? 0,
        price: product.price ?? 0,
        name: product.name ?? '',
        id: product.id ?? '',
        active: product.active ?? false,
      }))
      const sortedProducts = mappedProducts.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setProducts(sortedProducts);
      setFilteredProducts(sortedProducts);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      })
    }
    setIsLoading(false)
  }

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteProduct(id)
      if (result.success) {
        setProducts(prevProducts => prevProducts.filter(product => product.id !== id))
        toast({
          title: "Product deleted",
          description: "The product has been successfully deleted.",
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast({
        title: "Error",
        description: "Failed to delete the product. Please try again.",
        variant: "destructive",
      })
    }
  }

  const renderTable = (products: Product[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden w-[100px] sm:table-cell">
            <span className="sr-only">Image</span>
          </TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden md:table-cell">Price</TableHead>
          <TableHead className="hidden md:table-cell">Total Sales</TableHead>
          <TableHead className="hidden md:table-cell">Created at</TableHead>
          <TableHead><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <ProductTableContent
          products={products}
          isLoading={isLoading}
          onDelete={handleDelete}
          statusFilter={statusFilter}
        />
      </TableBody>
    </Table>
  );

  return (
    <main className="grid flex-1 items-start gap-4 md:p-4 sm:py-0 md:gap-8">
      <Tabs defaultValue="all">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All Products</TabsTrigger>
            <TabsTrigger value="out-of-stock">Out of Stock</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Input
              type="search"
              placeholder="Search products..."
              className="h-8 w-[150px] lg:w-[250px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <ListFilter className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Filter
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={statusFilter === 'active'} onCheckedChange={(checked) => setStatusFilter(checked ? 'active' : 'all')}>Active</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={statusFilter === 'out-of-stock'} onCheckedChange={(checked) => setStatusFilter(checked ? 'out-of-stock' : 'all')}>Out of Stock</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
            </Button>
            <Button size="sm" className="h-8 gap-1" onClick={() => router.push('/dashboard/products/new')}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Product</span>
            </Button>
          </div>
        </div>
        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
              <CardDescription>Manage your products and view their sales performance.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductTableContent
                products={filteredProducts}
                isLoading={isLoading}
                onDelete={handleDelete}
                statusFilter="all"
              />
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{filteredProducts.length}</strong> of <strong>{products.length}</strong> products
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="out-of-stock">
          <Card>
            <CardHeader>
              <CardTitle>Out of Stock Products</CardTitle>
              <CardDescription>View and manage products that are currently out of stock.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProductTableContent
                products={filteredProducts}
                isLoading={isLoading}
                onDelete={handleDelete}
                statusFilter="out-of-stock"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}
