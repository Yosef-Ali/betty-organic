import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { TestimonialForm } from '@/components/settings/EditTestimonialForm';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default async function NewTestimonialPage() {
  const { user, isAdmin } = await getCurrentUser();

  if (!user || !isAdmin) {
    redirect('/dashboard');
  }

  return (
    <>
      <div className="flex items-center justify-between ">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">New Testimonial</h2>
          <p className="text-muted-foreground">
            Add a new customer testimonial to the website
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <TestimonialForm />
        </CardContent>
      </Card>
    </>
  );
}
