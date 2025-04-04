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
      category: 'All',
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
        const result = await updateProduct(initialData.id, formData);
        if (!result || typeof result !== 'object') {
          throw new Error('Failed to update product: Invalid response');
        }
        if ('error' in result) {
          throw new Error(
            typeof result.error === 'string'
              ? result.error
              : 'Failed to update product',
          );
        }
      } else {
        const result = await createProduct(formData);
        if (!result || typeof result !== 'object') {
          throw new Error('Failed to create product: Invalid response');
        }
        if ('error' in result) {
          throw new Error(
            typeof result.error === 'string'
              ? result.error
              : 'Failed to create product',
          );
        }
      }

      toast({
        title: 'Success',
        description: initialData
          ? 'Product updated successfully'
          : 'Product created successfully',
      });

      router.push('/dashboard/products');
      router.refresh();
    } catch (error: unknown) {
      let errorMessage = 'An unexpected error occurred';
      let validationErrors: string[] = [];

      // Handle Fetch API errors
      if (error instanceof Response) {
        try {
          const errorData = await error.json();
          errorMessage = errorData.message || error.statusText;
          validationErrors = errorData.errors || [];
        } catch (e) {
          errorMessage = `HTTP Error: ${error.status} ${error.statusText}`;
        }
      }
      // Handle Zod validation errors from server
      else if (error && typeof error === 'object' && 'errors' in error) {
        // Handle Zod-like validation errors
        const zodError = error as {
          errors: Array<{ path: string[]; message: string }>;
        };
        validationErrors = zodError.errors.map(
          e => `${e.path.join('.')}: ${e.message}`,
        );
        errorMessage = 'Validation failed';
      }
      // Handle standard Error objects
      else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error(
        'Form submission error:',
        JSON.stringify(
          {
            message: errorMessage,
            validationErrors,
            timestamp: new Date().toISOString(),
            path: window.location.pathname,
          },
          null,
          2,
        ),
      );

      toast({
        title: 'Submission Error',
        description:
          validationErrors.length > 0
            ? validationErrors.join('\n')
            : errorMessage,
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
        id="product-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto max-w-5xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          <ProductDetailsForm form={form} />
          <ProductMediaForm
            form={form}
            isLoading={isLoading}
            initialData={initialData}
          />
        </div>
      </form>
    </Form>
  );
}
