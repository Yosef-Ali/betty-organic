import { useState, useEffect, useMemo } from 'react';
import { Testimonial } from '@/lib/types/supabase';
import { getTestimonials } from '@/app/actions/testimonialActions';
import { useToast } from '@/hooks/use-toast';

interface UseTestimonialsProps {
  initialTestimonials?: Testimonial[];
  filterStatus?: 'pending' | 'approved';
}

export function useTestimonials({
  initialTestimonials = [],
  filterStatus,
}: UseTestimonialsProps) {
  const [testimonials, setTestimonials] =
    useState<Testimonial[]>(initialTestimonials);
  const [isLoading, setIsLoading] = useState(!initialTestimonials.length);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!initialTestimonials.length) {
      const fetchTestimonials = async () => {
        try {
          const fetchedTestimonials = await getTestimonials();
          setTestimonials(fetchedTestimonials);
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to fetch testimonials',
            variant: 'destructive',
          });
        } finally {
          setIsLoading(false);
        }
      };

      fetchTestimonials();
    }
  }, [initialTestimonials.length, toast]);

  const filteredTestimonials = useMemo(() => {
    // First filter by status
    let filtered = testimonials;
    if (filterStatus) {
      filtered = testimonials.filter(t =>
        filterStatus === 'approved' ? t.approved : !t.approved,
      );
    }

    // Then filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(testimonial =>
        [testimonial.author_name, testimonial.role, testimonial.content].some(
          field => field?.toLowerCase().includes(lowerSearchTerm),
        ),
      );
    }

    return filtered;
  }, [testimonials, filterStatus, searchTerm]);

  return {
    testimonials: filteredTestimonials,
    isLoading,
    searchTerm,
    setSearchTerm,
    setTestimonials,
  };
}
