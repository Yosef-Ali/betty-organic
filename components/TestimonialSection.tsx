'use client';

import { Testimonial } from '@/lib/types/supabase';
import { useEffect, useState } from 'react';
import { getTestimonials } from '@/app/actions/testimonialActions';
import { Card, CardContent } from '@/components/ui/card';

export default function TestimonialSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const data = await getTestimonials();
        // Ensure all required fields are present with default values if needed
        const formattedTestimonials: Testimonial[] = data.map(testimonial => ({
          id: testimonial.id,
          image_url: testimonial.image_url || null,
          rating: typeof testimonial.rating === 'number' ? testimonial.rating : 5,
          approved: testimonial.approved || false,
          role: testimonial.role || '',
          author: testimonial.author || '',
          content: testimonial.content || '',
          created_at: testimonial.created_at,
          updated_at: testimonial.updated_at
        }));
        setTestimonials(formattedTestimonials);
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (loading) {
    return <div className="py-24 text-center">Loading testimonials...</div>;
  }

  if (testimonials.length === 0) {
    return null; // Don't show section if no approved testimonials
  }

  return (
    <section className="py-24 bg-gray-50">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col items-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-2">
            What Our Customers Say
          </h2>
          <p className="text-sm uppercase tracking-wide text-primary font-medium mb-4">
            Verified Reviews
          </p>
          <p className="mt-2 text-lg text-muted-foreground text-center max-w-3xl">
            Join thousands of satisfied customers who love our organic products
          </p>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-4">
          {testimonials.map(testimonial => (
            <Card key={testimonial.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 line-clamp-4">{testimonial.content}</p>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="font-semibold text-gray-900">{testimonial.author}</p>
                  {testimonial.role && (
                    <p className="text-sm text-gray-500 mt-1">{testimonial.role}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
