'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createProduct, updateProduct } from '@/app/actions/productActions';
import {
  ProductFormValues,
  productFormSchema,
} from './products/ProductFormSchema';
import { ProductDetailsForm } from './products/ProductDetailsForm';
import { ProductMediaForm } from './products/ProductMediaForm';

interface ProductFormProps {
  initialData?: ProductFormValues & { id: string };
  isAdmin: boolean;
  isSales: boolean;
}

// Change the return type from JSX.Element to React.ReactElement | null
export function ProductForm({
  initialData,
  isAdmin,
  isSales,
}: ProductFormProps): React.ReactElement | null {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  // Move useEffect to top level
  useEffect(() => {
    if (!isAdmin && !isSales) {
      router.push('/dashboard');
    }
  }, [isAdmin, isSales, router]);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      imageUrl: '',
      status: 'active',
    },
  });

  const validateFormData = (data: ProductFormValues): boolean => {
    if (!data.name || data.name.length < 2) {
      toast({
        title: 'Validation Error',
        description: 'Product name must be at least 2 characters long',
        variant: 'destructive',
      });
      return false;
    }
    if (data.price < 0) {
      toast({
        title: 'Validation Error',
        description: 'Price must be a positive number',
        variant: 'destructive',
      });
      return false;
    }
    if (data.stock < 0) {
      toast({
        title: 'Validation Error',
        description: 'Stock must be a non-negative number',
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  const onSubmit = async (data: ProductFormValues) => {
    if (isLoading) return;

    if (!isAdmin && !isSales) {
      toast({
        title: 'Access Denied',
        description: "You don't have permission to manage products",
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsLoading(true);

      if (!validateFormData(data)) {
        return;
      }

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      if (initialData?.id) {
        await updateProduct(initialData.id, formData);
      } else {
        await createProduct(formData);
      }

      toast({
        title: 'Success',
        description: initialData
          ? 'Product updated successfully'
          : 'Product created successfully',
      });

      router.push('/dashboard/products');
      router.refresh();
    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAdmin && !isSales) {
    return null;
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-5xl"
      >
        <div className="flex items-center gap-4 mb-6">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => router.back()}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <h1 className="text-xl font-semibold">
            {initialData ? 'Edit Product' : 'Add Product'}
          </h1>
          <Badge variant="outline" className="ml-auto">
            {form.watch('stock') > 0 ? 'In stock' : 'Out of stock'}
          </Badge>
          <div className="hidden md:flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => form.reset()}
            >
              Discard
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading
                ? 'Saving...'
                : initialData
                  ? 'Update Product'
                  : 'Save Product'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          <ProductDetailsForm form={form} />
          <ProductMediaForm
            form={form}
            isLoading={isLoading}
            initialData={initialData}
          />
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center justify-center gap-2 mt-6 md:hidden">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => form.reset()}
          >
            Discard
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading
              ? 'Saving...'
              : initialData
                ? 'Update Product'
                : 'Save Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
