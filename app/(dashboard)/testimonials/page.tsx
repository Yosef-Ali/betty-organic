import { getTestimonials } from '@/app/actions/testimonialActions';
import TestimonialTable from '@/components/testimonials/TestimonialTable';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Testimonials',
  description: 'Manage customer testimonials and reviews.',
};

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials();

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground">
            Manage and moderate customer testimonials
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/testimonials/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Testimonial
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>View and manage all testimonials</CardDescription>
          </CardHeader>
          <CardContent>
            <TestimonialTable initialTestimonials={testimonials || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
