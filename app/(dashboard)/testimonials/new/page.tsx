import { EditTestimonialForm } from '@/components/testimonials/EditTestimonialForm';

export const metadata = {
  title: 'New Testimonial',
  description: 'Create a new customer testimonial.',
};

export default function NewTestimonialPage() {
  const emptyTestimonial = {
    id: '',
    author_name: '',
    role: '',
    content: '',
    approved: false,
    image_url: null,
  };

  return (
    <div className="h-full">
      <EditTestimonialForm initialData={emptyTestimonial} />
    </div>
  );
}
