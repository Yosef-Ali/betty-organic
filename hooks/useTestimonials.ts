import { useState, useEffect, useMemo, useRef } from 'react';
import { Testimonial } from '@/lib/types/testimonials';
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
  const [isLoading, setIsLoading] = useState(initialTestimonials.length === 0);
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
    // If we have initial testimonials, use them and don't fetch
    if (initialTestimonials.length > 0) {
      setTestimonials(initialTestimonials);
      setIsLoading(false);
      fetchedRef.current = true;
      return;
    }

    // Prevent multiple fetches
    if (fetchedRef.current || fetchingRef.current) {
      return;
    }

    const fetchTestimonialsData = async () => {
      if (fetchingRef.current || !isMountedRef.current) return;
      
      fetchingRef.current = true;
      setIsLoading(true);

      try {
        console.log('[TESTIMONIALS DEBUG] Starting fetch...');
        const data = await getTestimonials();
        console.log('[TESTIMONIALS DEBUG] Fetched data:', data?.length || 0, 'testimonials');
        
        if (isMountedRef.current) {
          setTestimonials(data || []);
          fetchedRef.current = true;
        }
      } catch (error) {
        console.error('[TESTIMONIALS DEBUG] Fetch error:', error);
        if (isMountedRef.current) {
          // Ensure we still set testimonials to empty array on error
          setTestimonials([]);
          toast({
            title: 'Error',
            description: 'Failed to fetch testimonials',
            variant: 'destructive',
          });
        }
      } finally {
        console.log('[TESTIMONIALS DEBUG] Fetch completed, setting loading to false');
        if (isMountedRef.current) {
          setIsLoading(false);
        }
        fetchingRef.current = false;
      }
    };

    fetchTestimonialsData();
  }, [initialTestimonials.length]); // Depend on initial testimonials length

  const filteredTestimonials = useMemo(() => {
    // First filter by status
    let filtered = testimonials;
    if (filterStatus) {
      filtered = testimonials.filter(t =>
        filterStatus === 'approved' ? t.approved === true : t.approved !== true,
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
