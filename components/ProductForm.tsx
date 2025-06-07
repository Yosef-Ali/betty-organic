'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createProduct, updateProduct } from '@/app/actions/productActions';
import {
  ProductFormValues,
  productFormSchema,
} from './products/ProductFormSchema';
import { ProductDetailsForm } from './products/ProductDetailsForm';
import { ProductMediaForm } from './products/ProductMediaForm';
import { ValidationMessages } from './products/ValidationMessages';
import { useProductFormState } from '@/hooks/useProductFormState';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Banknote, Package, AlertTriangle, Save, X } from 'lucide-react';

interface ProductFormProps {
  initialData?: ProductFormValues & { id: string };
  isAdmin: boolean;
  isSales: boolean;
}

export function ProductForm({
  initialData,
  isAdmin,
  isSales,
}: ProductFormProps): React.ReactElement | null {
  const router = useRouter();
  const { toast } = useToast();
  const {
    isSubmitting,
    setIsSubmitting,
    validateBusinessRules,
    calculateEstimatedValue,
  } = useProductFormState();

  // Redirect if no permissions
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
    mode: 'onBlur',
  });

  const watchedValues = form.watch();
  
  // Real-time validation
  const validation = useMemo(() => {
    return validateBusinessRules(watchedValues);
  }, [watchedValues, validateBusinessRules]);

  const estimatedValue = useMemo(() => {
    return calculateEstimatedValue(watchedValues);
  }, [watchedValues, calculateEstimatedValue]);

  const onSubmit = async (data: ProductFormValues) => {
    if (isSubmitting) return;

    if (!isAdmin && !isSales) {
      toast({
        title: 'Access Denied',
        description: "You don't have permission to manage products",
        variant: 'destructive',
      });
      return;
    }

    // Validate business rules before submission
    const businessValidation = validateBusinessRules(data);
    if (!businessValidation.isValid) {
      toast({
        title: 'Validation Error',
        description: businessValidation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formData.append(key, String(value));
        }
      });

      let result;
      if (initialData?.id) {
        result = await updateProduct(initialData.id, formData);
      } else {
        result = await createProduct(formData);
      }

      if (!result || (typeof result === 'object' && 'error' in result)) {
        throw new Error(
          typeof result === 'object' && result.error 
            ? String(result.error) 
            : 'Operation failed'
        );
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
      console.error('Form submission error:', error);
      
      toast({
        title: 'Submission Error',
        description: error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
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
    <div className="space-y-6">
      <Form {...form}>
        <form
          id="product-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6"
          noValidate
        >
          {/* Product Summary Card */}
          {(watchedValues.name || watchedValues.price > 0 || watchedValues.stock > 0) && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="font-semibold text-blue-900">
                      {watchedValues.name || 'New Product'}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-blue-700">
                      {watchedValues.price > 0 && (
                        <div className="flex items-center gap-1">
                          <Banknote className="h-3 w-3" />
                          {watchedValues.price.toFixed(2)} ETB
                        </div>
                      )}
                      {watchedValues.stock > 0 && (
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          {watchedValues.stock} units
                        </div>
                      )}
                    </div>
                  </div>
                  {estimatedValue > 0 && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Est. Value: {estimatedValue.toFixed(2)} ETB
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Validation Messages */}
          <ValidationMessages 
            errors={validation.errors}
            warnings={validation.warnings}
            isValid={validation.isValid}
          />

          {/* Form Fields */}
          <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6">
            <ProductDetailsForm form={form} />
            <ProductMediaForm
              form={form}
              isLoading={isSubmitting}
              initialData={initialData}
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t">
            <div className="text-sm text-muted-foreground">
              {form.formState.isDirty && !isSubmitting && (
                <span className="text-orange-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Unsaved changes
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/products')}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || !validation.isValid}
                className="min-w-[140px]"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    {initialData ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {initialData ? 'Update Product' : 'Create Product'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
