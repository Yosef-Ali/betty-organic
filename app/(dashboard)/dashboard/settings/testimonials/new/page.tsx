import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { EditTestimonialForm } from '@/components/testimonials/EditTestimonialForm';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default async function NewTestimonialPage() {
  const { user, isAdmin } = await getCurrentUser();

  if (!user || !isAdmin) {
    redirect('/dashboard');
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-semibold tracking-tight">
          New Testimonial
        </h2>
        <p className="text-muted-foreground">
          Add a new customer testimonial to the website
        </p>
      </CardHeader>
      <CardContent>
        <EditTestimonialForm />
      </CardContent>
    </Card>
  );
}
