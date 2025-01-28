'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { TestimonialDetailsForm } from './TestimonialDetailsForm';
import { TestimonialFormSchema, TestimonialFormValues } from './TestimonialFormSchema';
import { useToast } from '@/hooks/use-toast';

export function TestimonialForm() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<TestimonialFormValues>({
    resolver: zodResolver(TestimonialFormSchema),
    defaultValues: {
      name: '',
      role: '',
      content: '',
      status: 'active',
    },
  });

  const onSubmit = async (data: TestimonialFormValues) => {
    try {
      // TODO: Implement testimonial creation logic
      toast({
        title: 'Success',
        description: 'Testimonial created successfully',
      });
      router.push('/dashboard/testimonials');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create testimonial',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <TestimonialDetailsForm form={form} />
        <Button type="submit" className="ml-auto">
          Create Testimonial
        </Button>
      </form>
    </Form>
  );
}
