import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { getTestimonial } from '@/app/actions/testimonialActions';
import { EditTestimonialForm } from '@/components/testimonials/EditTestimonialForm';
import { TestimonialData } from '@/components/testimonials/TestimonialFormSchema';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

interface EditTestimonialPageProps {
  params: { id: string };
}

export default async function EditTestimonialPage({
  params,
}: EditTestimonialPageProps) {
  const { user, isAdmin } = await getCurrentUser();

  if (!user || !isAdmin) {
    redirect('/dashboard');
  }

  let testimonial: TestimonialData | null = null;

  try {
    testimonial = (await getTestimonial(params.id)) as TestimonialData;
  } catch (error) {
    console.error('Error loading testimonial:', error);
    // Will show not found message below
  }

  if (!testimonial) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <h2 className="text-2xl font-semibold tracking-tight">
              Testimonial not found
            </h2>
            <p className="text-muted-foreground mt-2">
              The testimonial you are looking for does not exist or has been
              removed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold tracking-tight">
          Edit Testimonial
        </h2>
        <p className="text-muted-foreground">Update the testimonial details</p>
      </CardHeader>
      <CardContent>
        <EditTestimonialForm initialData={testimonial} />
      </CardContent>
    </Card>
  );
}
