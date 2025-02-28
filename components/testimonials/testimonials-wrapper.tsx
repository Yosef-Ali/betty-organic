
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TestimonialSection } from './testimonial-section';

export function TestimonialsWrapper() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('testimonials')
          .select('*')
          .eq('approved', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading testimonials:', error);
          return;
        }

        if (data && data.length > 0) {
          setTestimonials(data);
        }
      } catch (err) {
        console.error('Failed to fetch testimonials:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-40 bg-gray-100 rounded-md"></div>;
  }

  if (testimonials.length === 0) {
    return null;
  }

  return <TestimonialSection testimonials={testimonials} />;
}
