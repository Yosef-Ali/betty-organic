'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { ImageSelector } from "@/components/ImageSelector"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft } from 'lucide-react'
import Image from 'next/image'
import { createProduct, updateProduct } from '@/app/actions/productActions'
import { uploadImage } from '@/app/actions/upload-image'

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

const DEFAULT_PRODUCT_IMAGE = '/placeholder-product.jpg'

export function ProductForm({ initialData }: { initialData?: ProductFormValues & { id: string } }) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
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
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  async function onSubmit(data: ProductFormValues) {
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('description', data.description || '')
      formData.append('price', data.price.toString())
      formData.append('stock', data.stock.toString())
      formData.append('status', data.status || 'active')
      formData.append('imageUrl', data.imageUrl || '')

      if (initialData?.id) {
        await updateProduct(initialData.id, formData)
        toast({
          title: "Product updated",
          description: "The product has been successfully updated.",
        })
      } else {
        const newProduct = await createProduct(formData)
        if (selectedFile && newProduct.id) {
          const imageFormData = new FormData()
          imageFormData.append('file', selectedFile)
          imageFormData.append('productId', newProduct.id)
          await uploadImage(imageFormData)
        }
        toast({
          title: "Product created",
          description: "The product has been successfully created.",
        })
      }

      router.push('/dashboard/products')
      router.refresh()
    } catch (error) {
      console.error('Error in onSubmit:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save the product. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    const newPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(newPreviewUrl)
    form.setValue('imageUrl', newPreviewUrl)

    setSelectedFile(file)

    if (initialData?.id) {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('productId', initialData.id)

      try {
        setIsLoading(true)
        const uploadResponse = await uploadImage(formData)
        if (uploadResponse.success) {
          form.setValue('imageUrl', uploadResponse.imageUrl)
          setPreviewUrl('')
          form.trigger('imageUrl')
          toast({
            title: "Image uploaded",
            description: "The image has been successfully uploaded.",
          })
        } else {
          throw new Error(uploadResponse.error || 'Failed to upload image')
        }
      } catch (error) {
        console.error('Error in handleImageUpload:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload image. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-5xl">
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
            <Button type="button" variant="outline" size="sm" onClick={() => form.reset()}>
              Discard
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialData ? 'Update Product' : 'Save Product'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          {/* Product Details Column */}
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
              <CardDescription>Enter the details of your product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      <Textarea
                        placeholder="Product description"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0.00"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value))}
                        />
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
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value, 10))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Media & Status Column */}
          <Card>
            <CardHeader>
              <CardTitle>Product Image</CardTitle>
              <CardDescription>Upload or select an image for your product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                      <div className="space-y-4">
                        {/* Main Preview Area */}
                        <div className="relative aspect-square w-full overflow-hidden rounded-lg border bg-muted">
                          <Image
                            alt="Product preview"
                            className="object-cover"
                            fill
                            src={previewUrl || field.value || DEFAULT_PRODUCT_IMAGE}
                            sizes="(max-width: 768px) 100vw, 300px"
                            priority
                          />
                        </div>

                        {/* Upload Controls */}
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            disabled={isLoading}
                            className="cursor-pointer flex-1"
                          />
                        </div>

                        {/* Image Selector Grid */}
                        <div className="space-y-2">
                          <FormLabel className="text-sm">Select from library</FormLabel>
                          <ImageSelector
                            value={field.value}
                            onChange={(url) => {
                              setPreviewUrl('');
                              field.onChange(url);
                            }}
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload a new image or select from the image library
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>

        {/* Mobile Actions */}
        <div className="flex items-center justify-center gap-2 mt-6 md:hidden">
          <Button type="button" variant="outline" size="sm" onClick={() => form.reset()}>
            Discard
          </Button>
          <Button type="submit" size="sm" disabled={isLoading}>
            {isLoading ? 'Saving...' : initialData ? 'Update Product' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
