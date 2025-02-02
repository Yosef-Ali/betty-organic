'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusCircle, ListFilter, File } from 'lucide-react';
import { getProducts, deleteProduct } from '@/app/actions/productActions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { ProductTableContent } from './ProductTableContent';

const ProductTable = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'out-of-stock'>(
    'all',
  );
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
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
      }));
      setProducts(transformedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      toast({
        title: 'Error',
        description: 'Failed to load products. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast({
        title: 'Success',
        description: 'Product deleted successfully.',
      });
      loadProducts(); // Reload the products list
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product. Please try again.',
        variant: 'destructive',
      });
    }
  };

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
            <ProductTableContent
              products={products}
              isLoading={isLoading}
              onDelete={handleDelete}
              statusFilter={activeTab}
            />
          </Table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex-1 flex-col space-y-8 md:p-4">
      <Tabs
        defaultValue="all"
        className="space-y-4"
        onValueChange={(value: any) => setActiveTab(value)}
      >
        <div className="flex flex-wrap items-center justify-between gap-y-2">
          <TabsList className="flex-wrap gap-1">
            <TabsTrigger
              value="all"
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              All Products
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              value="out-of-stock"
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              Out of Stock
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center space-x-2">
            <Input
              type="search"
              placeholder="Search products..."
              className="h-8 w-[150px] lg:w-[250px]"
              value=""
              onChange={e => {}}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 lg:px-3"
                >
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filter
                  <File className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={activeTab === 'active'}
                  onCheckedChange={checked =>
                    setActiveTab(checked ? 'active' : 'all')
                  }
                >
                  Active
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={activeTab === 'out-of-stock'}
                  onCheckedChange={checked =>
                    setActiveTab(checked ? 'out-of-stock' : 'all')
                  }
                >
                  Out of Stock
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center space-x-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => router.push('/dashboard/products/new')}
                    >
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
              <CardDescription>
                View and manage all your products.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTable(filteredProducts)}</CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="out-of-stock" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Out of Stock Products</CardTitle>
              <CardDescription>
                View and manage products that are currently out of stock.
              </CardDescription>
            </CardHeader>
            <CardContent>{renderTable(filteredProducts)}</CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductTable;
