'use client'

import { useState } from 'react'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Product } from '@/lib/types';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().min(0),
  status: z.enum(["active", "out_of_stock"]),
  image: z.string().optional(),
});

type ProductFormValues = z.infer<typeof formSchema>;

interface ProductFormProps {
  initialData?: ProductFormValues;
  onSubmit?: (data: ProductFormValues) => void;
}

export function ProductForm({ initialData, onSubmit }: ProductFormProps) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      price: 0,
      stock: 0,
      status: "active",
      image: "",
    },
  });

  const handleSubmit = (data: ProductFormValues) => {
    if (onSubmit) {
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
      <ImageUpload
        value={form.watch("image")}
        onChange={(url: string) => form.setValue("image", url)}
      />

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={form.watch("name")}
            onChange={(e) => form.setValue("name", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.watch("description")}
            onChange={(e) => form.setValue("description", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            min="0"
            step="0.01"
            value={form.watch("price")}
            onChange={(e) => form.setValue("price", parseFloat(e.target.value))}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="stock">Stock</Label>
          <Input
            id="stock"
            type="number"
            min="0"
            value={form.watch("stock")}
            onChange={(e) => form.setValue("stock", parseInt(e.target.value))}
            required
          />
        </div>
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? 'Saving...' : initialData?.id ? 'Update Product' : 'Create Product'}
      </Button>
    </form>
  )
}
