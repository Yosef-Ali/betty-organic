'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable } from '@/components/ui/data-table';
import { useToast } from '@/hooks/use-toast';
import { deleteTestimonial } from '@/app/actions/testimonialActions';
import { Testimonial } from '@/lib/types/supabase';

interface TestimonialListProps {
  initialTestimonials: Testimonial[];
}

export function TestimonialList({ initialTestimonials }: TestimonialListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const router = useRouter();
  const { toast } = useToast();

  const handleEdit = (id: string) => {
    router.push(`/dashboard/settings/testimonials/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this testimonial?')) {
      return;
    }

    try {
      const result = await deleteTestimonial(id);
      if (result.success) {
        setTestimonials(testimonials.filter(t => t.id !== id));
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
    }
  };

  const columns = [
    {
      accessorKey: 'name',
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
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <div
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.original.active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {row.original.active ? 'Active' : 'Inactive'}
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
            onClick={() => handleDelete(row.original.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const filteredTestimonials = testimonials.filter(
    testimonial =>
      testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.content.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
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
  );
}
