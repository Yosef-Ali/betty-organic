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
import Image from 'next/image';
import { v4 as uuidv4 } from 'uuid';

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(6, { message: 'Password must be at least 6 characters.' })
    .optional(),
  role: z.enum(['admin', 'user', 'customer']),
  status: z.enum(['active', 'inactive']),
  imageUrl: z.string().nullable().optional(),
});

type UserFormValues = z.infer<typeof formSchema>;

interface EditUserFormProps {
  initialData: {
    id: string;
    name: string;
    email: string;
    role?: 'admin' | 'user' | 'customer';
    status: 'active' | 'inactive';
    imageUrl?: string;
  };
}

const isValidRole = (
  role: string | undefined,
): role is 'admin' | 'user' | 'customer' => {
  return role === 'admin' || role === 'user' || role === 'customer';
};

export function EditUserForm({ initialData }: EditUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const validatedData = {
    ...initialData,
    role: isValidRole(initialData.role) ? initialData.role : 'user',
  };

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: validatedData || {
      name: '',
      email: '',
      password: '',
      role: 'user',
      status: 'active',
      imageUrl: '',
    },
  });

  async function onSubmit(data: UserFormValues) {
    setIsLoading(true);
    try {
      const response = await updateUser(initialData.id, {
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to update user');
      }

      toast({
        title: 'Success',
        description: 'User has been successfully updated',
      });
      router.push('/dashboard/users');
      router.refresh();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImageUpload(file: File) {
    setIsUploading(true);
    // TODO: Implement image upload logic
    setIsUploading(false);
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
                Edit User
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
                <Button
                  size="sm"
                  type="submit"
                  disabled={isLoading || isUploading}
                >
                  {isLoading ? 'Saving...' : 'Update User'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>
                      Update the details of the user
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
                              <Input placeholder="User's name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="user@example.com"
                                {...field}
                              />
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
                    <CardTitle>User Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
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
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="customer">Customer</SelectItem>
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
                          <FormLabel>User Image</FormLabel>
                          <FormControl>
                            <div className="grid gap-2">
                              <Image
                                alt="User image"
                                className="aspect-square w-full rounded-md object-cover"
                                height="300"
                                src={
                                  field.value ||
                                  initialData?.imageUrl ||
                                  '/uploads/placeholder.svg'
                                }
                                width="300"
                              />
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={async e => {
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
              <Button
                size="sm"
                type="submit"
                disabled={isLoading || isUploading}
              >
                {isLoading ? 'Saving...' : 'Update User'}
              </Button>
            </div>
          </div>
        </main>
      </form>
    </Form>
  );
}
