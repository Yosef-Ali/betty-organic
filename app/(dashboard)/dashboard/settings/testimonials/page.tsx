import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getTestimonials } from '@/app/actions/testimonialActions';
import { TestimonialList } from '@/components/testimonials/TestimonialList';
import { Plus } from 'lucide-react';
import { Testimonial } from '@/lib/types/supabase';

export default async function TestimonialsPage() {
  const { user, isAdmin } = await getCurrentUser();

  if (!user || !isAdmin) {
    redirect('/dashboard');
  }

  let testimonials: Testimonial[] = [];
  let error = null;

  try {
    testimonials = await getTestimonials();
  } catch (e: any) {
    error = e.message || 'Failed to load testimonials';
    console.error('Error loading testimonials:', e);
  }

  return (
    <div className="space-y-4 p-8 pt-6">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/dashboard/settings/testimonials/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Testimonial
          </Link>
        </Button>
      </div>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <TestimonialList initialTestimonials={testimonials as Testimonial[]} />
      )}
    </div>
  );
}
