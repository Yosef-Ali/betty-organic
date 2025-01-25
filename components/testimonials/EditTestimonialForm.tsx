'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { Switch } from '@/components/ui/switch';
import Image from 'next/image';
import {
  createTestimonial,
  updateTestimonial,
} from '@/app/actions/testimonialActions';

const formSchema = z.object({
  id: z.string().optional(),
  author_name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' }),
  role: z.string().min(2, { message: 'Role must be at least 2 characters.' }),
  content: z
    .string()
    .min(10, { message: 'Content must be at least 10 characters.' }),
  approved: z.boolean(),
  image_url: z.string().nullable().optional(),
});

type TestimonialFormValues = z.infer<typeof formSchema>;

interface EditTestimonialFormProps {
  initialData: {
    id: string;
    author_name: string;
    role: string;
    content: string;
    approved: boolean;
    image_url?: string | null;
  };
}

export function EditTestimonialForm({ initialData }: EditTestimonialFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      author_name: '',
      role: '',
      content: '',
      approved: false,
      image_url: null,
    },
  });

  async function onSubmit(data: TestimonialFormValues) {
    setIsLoading(true);
    try {
      if (initialData.id) {
        // Update existing testimonial
        await updateTestimonial(initialData.id, data);
        toast({
          title: 'Success',
          description: 'The testimonial has been successfully updated.',
        });
      } else {
        // Create new testimonial
        await createTestimonial(data);
        toast({
          title: 'Success',
          description: 'New testimonial has been successfully created.',
        });
      }
      router.push('/dashboard/testimonials');
      router.refresh();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast({
        title: 'Error',
        description: 'Failed to save testimonial. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleImageUpload(file: File) {
    setIsUploading(true);
    // TODO: Implement image upload logic similar to user management
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
                {initialData.id ? 'Edit Testimonial' : 'New Testimonial'}
              </h1>
              <Badge variant="outline" className="ml-auto sm:ml-0">
                {form.watch('approved') ? 'Approved' : 'Pending'}
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
                  {isLoading
                    ? 'Saving...'
                    : initialData.id
                    ? 'Update Testimonial'
                    : 'Create Testimonial'}
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
              <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Testimonial Details</CardTitle>
                    <CardDescription>
                      Update the testimonial information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <FormField
                        control={form.control}
                        name="author_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Author Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Author's name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role/Position</FormLabel>
                            <FormControl>
                              <Input placeholder="Author's role" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter the testimonial content..."
                                className="min-h-[150px]"
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
                    <CardTitle>Testimonial Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="approved"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel>Approved</FormLabel>
                            <FormDescription>
                              Toggle to approve or unapprove this testimonial
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Author Image</FormLabel>
                          <FormControl>
                            <div className="grid gap-2">
                              <Image
                                alt="Author image"
                                className="aspect-square w-full rounded-md object-cover"
                                height="300"
                                src={
                                  field.value ||
                                  initialData?.image_url ||
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
                {isLoading
                  ? 'Saving...'
                  : initialData.id
                  ? 'Update Testimonial'
                  : 'Create Testimonial'}
              </Button>
            </div>
          </div>
        </main>
      </form>
    </Form>
  );
}
