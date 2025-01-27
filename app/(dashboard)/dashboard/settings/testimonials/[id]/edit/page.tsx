import { getTestimonialById } from '@/app/actions/testimonialActions';
import { EditTestimonialForm } from '@/components/testimonials/EditTestimonialForm';
import { notFound } from 'next/navigation';

interface EditTestimonialPageProps {
  params: {
    id: string;
  };
}

export default async function EditTestimonialPage({
  params,
}: EditTestimonialPageProps) {
  const testimonial = await getTestimonialById(params.id);

  if (!testimonial) {
    notFound();
  }

  return (
    <div className="h-full">
      <EditTestimonialForm initialData={testimonial} />
    </div>
  );
}
