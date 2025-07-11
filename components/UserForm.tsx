'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, ControllerRenderProps } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ChevronLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Image from 'next/image'
import { createUser, updateUser } from '@/app/actions/userActions'

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }).optional(),
  role: z.enum(['admin', 'sales', 'customer']),
  status: z.enum(['active', 'inactive']),
  imageUrl: z.string().nullable().optional()
})

type UserFormValues = z.infer<typeof formSchema>

interface UserFormProps {
  initialData?: Partial<UserFormValues>
}

export function UserForm({ initialData }: UserFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const form = useForm<UserFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: '',
      email: '',
      password: '',
      role: 'customer',
      status: 'active',
      imageUrl: ''
    }
  })

  async function onSubmit(data: UserFormValues) {
    setIsLoading(true)
    try {
      let result;
      
      if (initialData?.id) {
        // Update existing user
        result = await updateUser(initialData.id, {
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status
        });
      } else {
        // Create new user
        if (!data.password) {
          toast({
            title: 'Error',
            description: 'Password is required for new users.',
            variant: 'destructive'
          })
          return;
        }
        
        result = await createUser({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role || 'customer', // Ensure default role
          status: data.status
        });
      }

      if (result.success) {
        toast({
          title: initialData ? 'User updated' : 'User created',
          description: `The user has been successfully ${initialData ? 'updated' : 'created'}.`
        })
        router.push('/dashboard/users')
        router.refresh()
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error saving user:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save user. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleImageUpload(file: File) {
    setIsUploading(true)
    // TODO: Implement image upload logic
    setIsUploading(false)
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
                {initialData ? 'Edit User' : 'Add User'}
              </h1>
              <Badge variant="outline" className="ml-auto sm:ml-0">
                {form.watch('status') === 'active' ? 'Active' : 'Inactive'}
              </Badge>
              <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" size="sm" onClick={() => form.reset()}>
                  Discard
                </Button>
                <Button size="sm" type="submit" disabled={isLoading || isUploading}>
                  {isLoading ? 'Saving...' : initialData ? 'Update User' : 'Create User'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>
                      Enter the details of the user
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
                              <Input type="email" placeholder="user@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {!initialData && (
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="••••••" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
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
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="sales">Sales</SelectItem>
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
                                src={field.value || initialData?.imageUrl || "/uploads/placeholder.svg"}
                                width="300"
                              />
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    await handleImageUpload(file)
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
                {isLoading ? 'Saving...' : initialData ? 'Update User' : 'Create User'}
              </Button>
            </div>
          </div>
        </main>
      </form>
    </Form>
  )
}
