'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, ControllerRenderProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { updateProfile } from '@/app/actions/profile';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerAvatarUpload } from '@/components/ui/customer-avatar-upload';
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().min(2, {
    message: 'Full name must be at least 2 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  phone: z.string().optional(),
  location: z.string().optional(),
  status: z.string(),
  imageUrl: z.string().optional().nullable(),
});

export type CustomerFormValues = z.infer<typeof formSchema>;

export function CustomerForm({
  initialData,
}: {
  initialData?: CustomerFormValues;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: initialData?.fullName || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
      imageUrl: '',
      location: initialData?.location || '',
      status: initialData?.status || 'active',
    },
  });

  async function onSubmit(data: CustomerFormValues) {
    setIsLoading(true);
    try {
      const customerId = initialData?.id || uuidv4();
      
      const result = await updateProfile({
        id: customerId,
        fullName: data.fullName,
        email: data.email,
        location: data.location,
        imageUrl: data.imageUrl,
        status: data.status || 'active',
        role: 'customer',
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to save customer');
      }

      toast({
        title: initialData ? 'Customer updated' : 'Customer created',
        description: `The customer has been successfully ${
          initialData ? 'updated' : 'created'
        }.`,
      });

      router.push('/dashboard/customers');
      router.refresh();
    } catch (error) {
      console.error('Error saving customer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save customer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => router.back()}
              >
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => form.reset()}
                >
                  Discard
                </Button>
                <Button size="sm" type="submit" disabled={isLoading}>
                  {isLoading
                    ? 'Saving...'
                    : initialData
                    ? 'Update Customer'
                    : 'Save Customer'}
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
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            CustomerFormValues,
                            'fullName'
                          >;
                        }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Customer's full name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            CustomerFormValues,
                            'email'
                          >;
                        }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="customer@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            CustomerFormValues,
                            'phone'
                          >;
                        }) => (
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
                        render={({
                          field,
                        }: {
                          field: ControllerRenderProps<
                            CustomerFormValues,
                            'location'
                          >;
                        }) => (
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
                    <CardTitle>Customer Photo</CardTitle>
                    <CardDescription>
                      Upload a profile photo for the customer
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CustomerAvatarUpload
                      form={form}
                      name="imageUrl"
                      size="lg"
                      className="flex flex-col items-center"
                      defaultImageUrl={
                        initialData?.imageUrl || '/placeholder-user.webp'
                      }
                      customerId={initialData?.id}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Customer Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="status"
                      render={({
                        field,
                      }: {
                        field: ControllerRenderProps<
                          CustomerFormValues,
                          'status'
                        >;
                      }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
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
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 md:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => form.reset()}
              >
                Discard
              </Button>
              <Button size="sm" type="submit" disabled={isLoading}>
                {isLoading
                  ? 'Saving...'
                  : initialData
                  ? 'Update Customer'
                  : 'Save Customer'}
              </Button>
            </div>
          </div>
        </main>
      </form>
    </Form>
  );
}
