'use client';

import { Testimonial } from '@/lib/types/supabase';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  createTestimonial,
  updateTestimonial,
} from '@/app/actions/testimonial-actions';

export function TestimonialForm({
  testimonial,
  onSuccess,
}: {
  testimonial: Testimonial;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: testimonial,
  });

  const onSubmit = async (data: Testimonial) => {
    try {
      const { data: result, error } = testimonial.id
        ? await updateTestimonial(data)
        : await createTestimonial(data);

      if (error) throw error;

      toast({
        title: 'Success',
        description: testimonial.id
          ? 'Testimonial updated'
          : 'Testimonial created',
      });
      onSuccess();
      reset(result);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save testimonial',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="author">Author</Label>
          <Input
            id="author"
            {...register('author', {
              required: 'Author is required',
            })}
          />
          {errors.author && (
            <p className="text-sm text-destructive">{errors.author.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            {...register('role', { required: 'Role is required' })}
          />
          {errors.role && (
            <p className="text-sm text-destructive">{errors.role.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Testimonial Content</Label>
          <Textarea
            id="content"
            {...register('content', { required: 'Content is required' })}
            className="min-h-[100px]"
          />
          {errors.content && (
            <p className="text-sm text-destructive">{errors.content.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="approved" {...register('approved')} />
          <Label htmlFor="approved">Approved</Label>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onSuccess} type="button">
            Cancel
          </Button>
          <Button type="submit">
            {testimonial.id ? 'Update' : 'Create'} Testimonial
          </Button>
        </div>
      </form>
    </div>
  );
}
