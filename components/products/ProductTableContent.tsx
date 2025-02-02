'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';
import { Product } from '@/types/product';
import { TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow, isValid } from 'date-fns';

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  try {
    const date = dateString ? new Date(dateString) : null;
    if (!date || !isValid(date)) return 'Invalid date';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

interface ProductTableContentProps {
  products: Product[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  statusFilter: 'all' | 'active' | 'out-of-stock';
}

export function ProductTableContent({
  products,
  isLoading,
  onDelete,
  statusFilter,
}: ProductTableContentProps) {
  const router = useRouter();

  const filteredProducts = products.filter(product => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return product.stock > 0;
    if (statusFilter === 'out-of-stock') return product.stock === 0;
    return true;
  });

  if (isLoading) {
    return (
      <tbody>
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
            Loading...
          </TableCell>
        </TableRow>
      </tbody>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <tbody>
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center">
            No products found.
          </TableCell>
        </TableRow>
      </tbody>
    );
  }

  return (
    <tbody>
      {filteredProducts.map((product: Product) => (
        <TableRow key={product.id}>
          <TableCell className="hidden sm:table-cell">
            <Image
              alt={`${product.name} image`}
              className="aspect-square rounded-md object-cover"
              height={64}
              width={64}
              src={product.imageUrl || '/placeholder-product.jpg'}
              onError={e => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-product.jpg';
              }}
            />
          </TableCell>
          <TableCell className="font-medium">{product.name}</TableCell>
          <TableCell className="hidden xs:table-cell">
            {product.price.toFixed(2)} Br
          </TableCell>
          <TableCell className="hidden md:table-cell">
            {product.stock}
          </TableCell>
          <TableCell>
            <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
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
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/products/${product.id}/edit`)
                  }
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={e => e.preventDefault()}>
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete {product.name}. This action
                        cannot be undone.
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
    </tbody>
  );
}
