import { useState, useEffect, useMemo, useRef } from 'react';
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

  // Use refs to prevent repeated API calls
  const fetchedRef = useRef(false);
  const isMountedRef = useRef(true);
  const fetchingRef = useRef(false);

  useEffect(() => {
    // Set up cleanup function
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (initialTestimonials.length > 0) {
      setTestimonials(initialTestimonials);
      setIsLoading(false);
      fetchedRef.current = true;
      return;
    }

    if (fetchedRef.current || fetchingRef.current) return;

    const fetchTestimonialsData = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      try {
        setIsLoading(true);
        const data = await getTestimonials();
        if (isMountedRef.current) {
          setTestimonials(data);
          fetchedRef.current = true;
        }
      } catch (error) {
        if (isMountedRef.current) {
          toast({
            title: 'Error',
            description: 'Failed to fetch testimonials',
            variant: 'destructive',
          });
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          fetchingRef.current = false;
        }
      }
    };

    fetchTestimonialsData();
  }, []); // Empty dependency array to run only once

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
        [testimonial.author, testimonial.role, testimonial.content].some(
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
