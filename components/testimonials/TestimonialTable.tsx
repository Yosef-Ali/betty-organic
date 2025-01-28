'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import {
  getTestimonials,
  deleteTestimonial,
  toggleApproval,
} from '@/app/actions/testimonialActions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Testimonial } from '@/lib/types/supabase'; // Import shared Testimonial type

interface TestimonialTableProps {
  initialTestimonials?: Testimonial[];
  filterStatus?: 'pending' | 'approved';
}

export function TestimonialTable({ initialTestimonials = [], filterStatus }: TestimonialTableProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const fetchTestimonials = async () => {
    try {
      const fetchedTestimonials = await getTestimonials();
      let filteredTestimonials = fetchedTestimonials;

      if (filterStatus) {
        filteredTestimonials = fetchedTestimonials.filter(
          t => (filterStatus === 'approved' ? t.approved : !t.approved)
        );
      }

      setTestimonials(filteredTestimonials);
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

  useEffect(() => {
    if (!initialTestimonials.length) {
      fetchTestimonials();
    }
  }, [filterStatus, initialTestimonials.length]);

  const filteredTestimonials = useMemo(() => {
    if (!searchTerm) return testimonials;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return testimonials.filter(testimonial =>
      [testimonial.author_name, testimonial.role, testimonial.content].some(
        field => field?.toLowerCase().includes(lowerSearchTerm),
      ),
    );
  }, [testimonials, searchTerm]);

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteTestimonial(id);
      setTestimonials(testimonials.filter(t => t.id !== id));
      toast({
        title: 'Success',
        description: 'Testimonial deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete testimonial',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleApproval = async (id: string, approved: boolean) => {
    try {
      setIsLoading(true);
      await toggleApproval(id, approved);
      setTestimonials(
        testimonials.map(t => (t.id === id ? { ...t, approved } : t)),
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to toggle approval status',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search testimonials..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TestimonialTableContent
              testimonials={filteredTestimonials}
              isLoading={isLoading}
              onDelete={handleDelete}
              onToggleApproval={handleToggleApproval}
            />
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TestimonialTableContent({
  testimonials,
  isLoading,
  onDelete,
  onToggleApproval,
}: {
  testimonials: Testimonial[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onToggleApproval: (id: string, approved: boolean) => Promise<void>;
}) {
  const router = useRouter();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="h-24 text-center">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (!testimonials || testimonials.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="h-24 text-center">
          No testimonials found.
        </TableCell>
      </TableRow>
    );
  }

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      toast({
        title: 'Success',
        description: 'Testimonial deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete testimonial',
        variant: 'destructive',
      });
    }
  };

  const handleToggleApproval = async (id: string, currentStatus: boolean) => {
    try {
      await onToggleApproval(id, !currentStatus);
      toast({
        title: 'Success',
        description:
          'Testimonial ' +
          (!currentStatus ? 'approved' : 'unapproved') +
          ' successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update testimonial status',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      {testimonials.map(testimonial => (
        <TableRow key={testimonial.id}>
          <TableCell>
            <div className="flex items-center space-x-3 flex-wrap gap-2">
              <Avatar>
                <AvatarImage src={testimonial.image_url || ''} alt={testimonial.author_name || 'Testimonial author'} />
                <AvatarFallback className="bg-muted">
                  {testimonial.author_name ? testimonial.author_name.charAt(0).toUpperCase() : 'T'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium truncate">{testimonial.author_name}</div>
                <div className="text-sm text-gray-500 truncate">{testimonial.role}</div>
              </div>
            </div>
          </TableCell>
          <TableCell className="max-w-[300px]">
            <p className="truncate">{testimonial.content}</p>
          </TableCell>
          <TableCell>
            {formatDistanceToNow(new Date(testimonial.created_at), {
              addSuffix: true,
            })}
          </TableCell>
          <TableCell>
            <div
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
              ${testimonial.approved
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
                }`}
            >
              {testimonial.approved ? 'Approved' : 'Pending'}
            </div>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() =>
                    router.push(
                      `/dashboard/settings/testimonials/${testimonial.id}/edit`,
                    )
                  }
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleToggleApproval(testimonial.id, testimonial.approved)
                  }
                >
                  {testimonial.approved ? 'Unapprove' : 'Approve'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-red-600"
                      onSelect={e => e.preventDefault()}
                    >
                      Delete
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete this testimonial from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(testimonial.id)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}
