'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
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
} from '@/components/ui/alert-dialog';

import { useTestimonials } from '@/hooks/useTestimonials';
import {
  TestimonialTableSkeleton,
  MobileTestimonialSkeleton,
} from './TestimonialTableSkeleton';
import { Testimonial } from '@/lib/types/testimonials';

interface TestimonialTableProps {
  initialTestimonials?: Testimonial[];
  filterStatus?: 'pending' | 'approved';
  onEdit?: (testimonial: Testimonial) => void;
}

export function TestimonialTable({
  initialTestimonials = [],
  filterStatus,
  onEdit,
}: TestimonialTableProps) {
  const [isLoading, setIsLoading] = useState(false);
  const {
    testimonials: filteredTestimonials,
    searchTerm,
    setSearchTerm,
    setTestimonials,
    isLoading: isLoadingTestimonials,
  } = useTestimonials({
    initialTestimonials,
    filterStatus,
  });

  const handleDelete = async (id: string) => {
    try {
      setIsLoading(true);
      await deleteTestimonial(id);
      setTestimonials(prev => prev.filter(t => t.id !== id));
      toast.success('Testimonial deleted successfully');
    } catch (error) {
      toast.error(
        `Failed to delete testimonial: ${
          error instanceof Error ? error.message : ''
        }`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleApproval = async (id: string) => {
    try {
      const testimonial = filteredTestimonials.find(t => t.id === id);
      if (!testimonial) return;

      setIsLoading(true);
      const newStatus = !testimonial.approved;
      await toggleApproval(id, newStatus);
      setTestimonials(prev =>
        prev.map(t => (t.id === id ? { ...t, approved: newStatus } : t)),
      );
      toast.success(
        `Testimonial ${newStatus ? 'approved' : 'unapproved'} successfully`,
      );
    } catch (error) {
      toast.error(
        `Failed to toggle approval status: ${
          error instanceof Error ? error.message : ''
        }`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 bg-background md:relative pb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-2">
          <Input
            placeholder="Search testimonials..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full sm:max-w-sm"
            aria-label="Search testimonials"
            type="search"
          />
        </div>
      </div>

      {/* Mobile View */}
      <div
        className="md:hidden space-y-4 touch-pan-y"
        onTouchStart={e => {
          const touch = e.touches[0];
          (e.currentTarget as any).touchStartX = touch.clientX;
          (e.currentTarget as any).touchStartY = touch.clientY;
        }}
        onTouchMove={e => {
          const touch = e.touches[0];
          const deltaX = touch.clientX - (e.currentTarget as any).touchStartX;
          const deltaY = touch.clientY - (e.currentTarget as any).touchStartY;
          // Only handle horizontal swipes
          if (Math.abs(deltaX) > Math.abs(deltaY)) {
            e.preventDefault();
            const card = (e.target as HTMLElement).closest('.testimonial-card');
            if (card) {
              card.style.transform = `translateX(${deltaX}px)`;
              card.style.transition = 'none';
            }
          }
        }}
        onTouchEnd={e => {
          const card = (e.target as HTMLElement).closest('.testimonial-card');
          if (card) {
            const deltaX =
              e.changedTouches[0].clientX -
              (e.currentTarget as any).touchStartX;
            card.style.transition = 'transform 0.2s ease-out';
            if (Math.abs(deltaX) > 100) {
              // Threshold for action
              const testimonialId = card.getAttribute('data-id');
              if (testimonialId) {
                if (deltaX > 0) {
                  // Swipe right for approval
                  handleToggleApproval(testimonialId);
                } else {
                  // Swipe left for deletion
                  handleDelete(testimonialId);
                }
              }
            }
            card.style.transform = '';
          }
        }}
      >
        {isLoadingTestimonials ? (
          <MobileTestimonialSkeleton />
        ) : (
          filteredTestimonials.map(testimonial => (
            <div
              key={testimonial.id}
              data-id={testimonial.id}
              className="testimonial-card p-4 rounded-lg border space-y-4 bg-background transform transition-transform touch-pan-y relative z-30"
            >
              {/* Swipe Indicators */}
              <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-red-500/20 to-transparent opacity-0 transition-opacity" />
              <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-green-500/20 to-transparent opacity-0 transition-opacity" />
              <div className="flex items-center justify-between relative">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage
                      src={testimonial.image_url || ''}
                      alt={testimonial.author || 'Anonymous'}
                    />
                    <AvatarFallback>
                      {testimonial.author?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {testimonial.author || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="absolute top-2 right-2 p-2"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(testimonial)}>
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => handleToggleApproval(testimonial.id)}
                    >
                      {testimonial.approved ? 'Unapprove' : 'Approve'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(testimonial.id)}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-gray-600 break-words line-clamp-3">
                {testimonial.content}
              </p>
              <div className="flex justify-between items-center text-sm">
                <div
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    testimonial.approved
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {testimonial.approved ? 'Approved' : 'Pending'}
                </div>
                <div className="text-gray-500">
                  {testimonial.created_at &&
                  typeof testimonial.created_at === 'string'
                    ? formatDistanceToNow(new Date(testimonial.created_at), {
                        addSuffix: true,
                      })
                    : 'No date available'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop View */}
      <div
        className="hidden md:block rounded-md border focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
        role="region"
        aria-label="Testimonials"
      >
        <div
          className="overflow-x-auto"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'ArrowRight') {
              e.currentTarget.scrollLeft += 100;
            } else if (e.key === 'ArrowLeft') {
              e.currentTarget.scrollLeft -= 100;
            }
          }}
        >
          <Table
            className="w-full [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap"
            role="grid"
          >
            <TableHeader>
              <TableRow>
                <TableHead aria-sort="none">Author</TableHead>
                <TableHead aria-sort="none">Content</TableHead>
                <TableHead aria-sort="none">Date</TableHead>
                <TableHead aria-sort="none">Status</TableHead>
                <TableHead className="w-[100px]" aria-sort="none">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTestimonials ? (
                <TestimonialTableSkeleton />
              ) : (
                <TestimonialTableContent
                  testimonials={filteredTestimonials}
                  isLoading={isLoading}
                  onDelete={handleDelete}
                  onToggleApproval={handleToggleApproval}
                  onEdit={onEdit}
                />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

// Single definition of TestimonialTableContent used for the desktop view.
function TestimonialTableContent({
  testimonials,
  isLoading,
  onDelete,
  onToggleApproval,
  onEdit,
}: {
  testimonials: Testimonial[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<void>;
  onToggleApproval: (id: string) => Promise<void>;
  onEdit?: (testimonial: Testimonial) => void;
}) {
  if (!testimonials || testimonials.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="h-24 text-center">
          No testimonials found.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {testimonials.map(testimonial => (
        <TableRow
          key={testimonial.id}
          role="row"
          tabIndex={0}
          className="focus-within:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              onEdit?.(testimonial);
              e.preventDefault();
            }
          }}
        >
          <TableCell>
            <div
              className="flex items-center space-x-3"
              role="cell"
              aria-label={`Author: ${testimonial.author || 'Anonymous'}`}
            >
              <Avatar>
                <AvatarImage
                  src={testimonial.image_url || ''}
                  alt={testimonial.author || 'Anonymous'}
                />
                <AvatarFallback>
                  {testimonial.author?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">
                  {testimonial.author || 'Anonymous'}
                </div>
                <div className="text-sm text-gray-500">{testimonial.role}</div>
              </div>
            </div>
          </TableCell>
          <TableCell className="max-w-[300px]">
            <p
              className="truncate"
              role="cell"
              aria-label="Testimonial content"
              title={testimonial.content}
            >
              {testimonial.content}
            </p>
          </TableCell>
          <TableCell>
            {testimonial.created_at &&
            typeof testimonial.created_at === 'string'
              ? formatDistanceToNow(new Date(testimonial.created_at), {
                  addSuffix: true,
                })
              : 'No date available'}
          </TableCell>
          <TableCell>
            <div
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                testimonial.approved
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
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 focus:ring-2 focus:ring-primary hover:bg-muted active:bg-muted"
                  disabled={isLoading}
                  aria-label="Actions menu"
                >
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit?.(testimonial)}>
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onToggleApproval(testimonial.id)}
                >
                  {testimonial.approved ? 'Unapprove' : 'Approve'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-red-600"
                      onSelect={e => e.preventDefault()}
                      aria-label={`Delete testimonial by ${
                        testimonial.author || 'Anonymous'
                      }`}
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
                        delete this testimonial.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(testimonial.id)}
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
