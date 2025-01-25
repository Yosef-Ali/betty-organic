'use client';

import { Testimonial } from '@/lib/types/supabase';
import { useEffect, useState } from 'react';
import { getApprovedTestimonials } from '@/app/actions/marketing-actions';
import { Card, CardContent } from '@/components/ui/card';

export default function TestimonialSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const { data } = await getApprovedTestimonials();
        if (data) {
          setTestimonials(data);
        }
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
          <h2 className="text-3xl font-bold tracking-tight text-center">
            What Our Customers Say
          </h2>
          <p className="mt-4 text-lg text-muted-foreground text-center max-w-3xl">
            Don&apos;t just take our word for it - hear from some of our
            satisfied customers
          </p>
        </div>

        <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map(testimonial => (
            <Card key={testimonial.id}>
              <CardContent className="p-6 space-y-4">
                <p className="text-gray-600">{testimonial.content}</p>
                <div className="mt-4">
                  <p className="font-semibold">{testimonial.author_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.company}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
