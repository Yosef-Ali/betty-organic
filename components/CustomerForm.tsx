'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, ControllerRenderProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { createCustomer, updateCustomer, uploadImage } from '@/app/actions/customersActions'
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2, {
    message: "Full name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  imageUrl: z.string().nullable().optional(),
})

type CustomerFormValues = z.infer<typeof formSchema>;

export function CustomerForm({ initialData }: {
  initialData?: CustomerFormValues;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      fullName: '',
      email: '',
      phone: '',
      imageUrl: '',
      location: '',
      status: 'active',
    },
  })

  async function onSubmit(data: CustomerFormValues) {
    setIsLoading(true)
    try {
      const customerData = { ...data };
      if (!initialData?.id) {
        customerData.id = uuidv4();
      }
      if (initialData?.id) {
        await updateCustomer({ ...customerData, id: initialData.id, email: data.email || '', full_name: data.fullName })
        toast({
          title: "Customer updated",
          description: "The customer has been successfully updated.",
        });
      } else {
        const formData = new FormData();
        for (const [key, value] of Object.entries(customerData)) {
          if (value !== undefined) {
            formData.append(key, value === null ? '' : value);
          }
        }
        const email = formData.get('email') as string | null;
        if (email === null) {
          throw new Error("Email is required");
        }
        const customer = await createCustomer(formData);
        if (customer && customer.id) {
          toast({
            title: "Customer created",
            description: "The new customer has been successfully created.",
          });
        } else {
          throw new Error("Failed to create customer");
        }
      }
      router.push('/dashboard/customers')
      router.refresh()
    } catch (error) {
      console.error('Error saving customer:', error)
      toast({
        title: "Error",
        description: "Failed to save customer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleImageUpload(file: File) {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const imageUrl = await uploadImage(formData);
      form.setValue('imageUrl', imageUrl);
      form.trigger('imageUrl');
      toast({
        title: "Image uploaded",
        description: "The image has been successfully uploaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
                {initialData ? 'Edit Customer' : 'Add Customer'}
              </h1>
              <Badge variant="outline" className="ml-auto sm:ml-0">
                {form.watch('status') === 'active' ? 'Active' : 'Inactive'}
              </Badge>
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" size="sm" onClick={() => form.reset()}>
                  Discard
                </Button>
                <Button size="sm" type="submit" disabled={isLoading || isUploading}>
                  {isLoading ? 'Saving...' : initialData ? 'Update Customer' : 'Save Customer'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Details</CardTitle>
                    <CardDescription>
                      Enter the details of the customer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }: { field: ControllerRenderProps<CustomerFormValues, 'fullName'> }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Customer's full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }: { field: ControllerRenderProps<CustomerFormValues, 'email'> }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="customer@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }: { field: ControllerRenderProps<CustomerFormValues, 'phone'> }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="+1234567890" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }: { field: ControllerRenderProps<CustomerFormValues, 'location'> }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input placeholder="City, Country" {...field} />
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
                <Card>
                  <CardHeader>
                    <CardTitle>Customer Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }: { field: ControllerRenderProps<CustomerFormValues, 'status'> }) => (
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
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="imageUrl"
                      render={({ field }: { field: ControllerRenderProps<CustomerFormValues, 'imageUrl'> }) => (
                        <FormItem>
                          <FormLabel>Customer Image</FormLabel>
                          <FormControl>
                            <div className="grid gap-2">
                              <Image
                                alt="Customer image"
                                className="aspect-square w-full rounded-md object-cover"
                                height="300"
                                src={field.value || initialData?.imageUrl || "/uploads/placeholder.svg"}
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
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 md:hidden">
              <Button variant="outline" size="sm" onClick={() => form.reset()}>
                Discard
              </Button>
              <Button size="sm" type="submit" disabled={isLoading || isUploading}>
                {isLoading ? 'Saving...' : initialData ? 'Update Customer' : 'Save Customer'}
              </Button>
            </div>
          </div>
        </main>
      </form>
    </Form>
  )
}
