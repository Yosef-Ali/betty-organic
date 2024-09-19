'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft, Upload } from 'lucide-react'
import Image from 'next/image'
import { createProduct, getProductImages, updateProduct, uploadImage } from '@/app/actions/productActions'

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  price: z.number().min(0, {
    message: "Price must be a positive number.",
  }),
  stock: z.number().int().min(0, {
    message: "Stock must be a non-negative integer.",
  }),
  imageUrl: z.string().optional(),
  status: z.enum(['active', 'out_of_stock']).optional(),
})

type ProductFormValues = z.infer<typeof formSchema>

export function ProductForm({ initialData }: { initialData?: ProductFormValues }) {
  const [isLoading, setIsLoading] = useState(false)
  const [productImages, setProductImages] = useState<string[]>([])
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      description: '',
      price: 0,
      stock: 0,
      imageUrl: '',
      status: 'active',
    },
  })

  useEffect(() => {
    if (initialData?.id) {
      getProductImages(initialData.id).then(setProductImages)
    }
  }, [initialData?.id])

  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString())
      })

      if (initialData?.id) {
        await updateProduct(initialData.id, formData)
        toast({
          title: "Product updated",
          description: "The product has been successfully updated.",
        })
      } else {
        await createProduct(formData)
        toast({
          title: "Product created",
          description: "The new product has been successfully created.",
        })
      }
      router.push('/dashboard/products')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save the product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleImageUpload(file: File) {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const imageUrl = await uploadImage(formData)
      form.setValue('imageUrl', imageUrl)
      // Trigger validation after setting the value
      form.trigger('imageUrl')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
              <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                {initialData ? 'Edit Product' : 'Add Product'}
              </h1>
              <Badge variant="outline" className="ml-auto sm:ml-0">
                {form.watch('stock') > 0 ? 'In stock' : 'Out of stock'}
              </Badge>
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" size="sm" onClick={() => form.reset()}>
                  Discard
                </Button>
                <Button size="sm" type="submit" disabled={isLoading}>
                  {isLoading ? 'Saving...' : initialData ? 'Update Product' : 'Save Product'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Product Details</CardTitle>
                    <CardDescription>
                      Enter the details of your product
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Product name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Product description" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="stock"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
                <Card x-chunk="dashboard-07-chunk-3">
                  <CardHeader>
                    <CardTitle>Product Images</CardTitle>
                    <CardDescription>Upload 1 images of your product</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product Image</FormLabel>
                            <FormControl>
                              <div className="grid gap-2">
                                <Image
                                  alt="Product image"
                                  className="aspect-square w-full rounded-md object-cover"
                                  height="300"
                                  src={field.value || "/uploads/placeholder.svg"}
                                  width="300"
                                />
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      await handleImageUpload(file);
                                    }
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>


            <div className="flex items-center justify-center gap-2 md:hidden">
              <Button variant="outline" size="sm" onClick={() => form.reset()}>
                Discard
              </Button>
              <Button size="sm" type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : initialData ? 'Update Product' : 'Save Product'}
              </Button>
            </div>
          </div>
        </main>
      </form>
    </Form>
  )
}