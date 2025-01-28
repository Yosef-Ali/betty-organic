'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { deleteTestimonial } from '@/app/actions/testimonialActions';
import { Star, User2 } from 'lucide-react';
import { Testimonial } from '@/lib/types/supabase';

interface TestimonialListProps {
  initialTestimonials: Testimonial[];
}

export function TestimonialList({ initialTestimonials }: TestimonialListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testimonialToDelete, setTestimonialToDelete] = useState<string | null>(
    null,
  );
  const router = useRouter();
  const { toast } = useToast();

  const handleEdit = (id: string) => {
    router.push(`/dashboard/settings/testimonials/${id}/edit`);
  };

  const handleDeleteClick = (id: string) => {
    setTestimonialToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!testimonialToDelete) return;

    try {
      const result = await deleteTestimonial(testimonialToDelete);
      if (result.success) {
        setTestimonials(testimonials.filter(t => t.id !== testimonialToDelete));
        toast({
          title: 'Success',
          description: 'Testimonial deleted successfully',
        });
      } else {
        throw new Error(result.error || 'Failed to delete testimonial');
      }
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to delete testimonial',
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setTestimonialToDelete(null);
    }
  };

  const ProfileAvatar = ({
    imageUrl,
    name,
  }: {
    imageUrl?: string | null;
    name: string;
  }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    return (
      <Avatar className="h-10 w-10 relative">
        {imageUrl && !hasError ? (
          <>
            <AvatarImage
              src={imageUrl}
              alt={`${name}'s profile`}
              onLoadingComplete={() => setIsLoading(false)}
              onError={() => {
                setHasError(true);
                setIsLoading(false);
              }}
            />
            {isLoading && (
              <div className="absolute inset-0">
                <Skeleton className="h-full w-full rounded-full" />
              </div>
            )}
          </>
        ) : (
          <AvatarFallback>
            <User2 className="h-5 w-5 text-gray-500" />
          </AvatarFallback>
        )}
      </Avatar>
    );
  };

  const columns = [
    {
      accessorKey: 'image_url',
      header: 'Profile',
      cell: ({ row }) => (
        <ProfileAvatar
          imageUrl={row.original.image_url}
          name={row.original.author}
        />
      ),
    },
    {
      accessorKey: 'author',
      header: 'Name',
    },
    {
      accessorKey: 'role',
      header: 'Role',
    },
    {
      accessorKey: 'content',
      header: 'Content',
      cell: ({ row }) => (
        <div className="max-w-[300px] truncate">{row.getValue('content')}</div>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Rating',
      cell: ({ row }) => {
        const rating = row.getValue('rating') as number;
        return (
          <div className="flex gap-0.5">
            {Array.from({ length: rating }).map((_, i) => (
              <Star
                key={i}
                className="h-4 w-4 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.original.approved
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
            }`}
        >
          {row.original.approved ? 'Active' : 'Inactive'}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(row.original.id)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-800"
            onClick={() => handleDeleteClick(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const filteredTestimonials = testimonials.filter(
    testimonial =>
      testimonial.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      <div>
        <div className="mb-4">
          <Input
            placeholder="Search testimonials..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <DataTable columns={columns} data={filteredTestimonials} />
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this testimonial. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
