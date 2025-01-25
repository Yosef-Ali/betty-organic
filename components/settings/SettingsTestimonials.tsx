'use client';

import { useState } from 'react';
import { Testimonial } from '@/lib/types/supabase';
import { Button } from '@/components/ui/button';
import { TestimonialForm } from '@/components/forms/TestimonialForm';
import { redirect } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '../../contexts/auth/AuthContext';

export function SettingsTestimonials() {
  const { user } = useAuth();

  // Redirect if not admin
  // if (!user?.user_metadata?.roles?.includes('admin')) {
  //   redirect('/dashboard');
  // }

  const [selectedTestimonial, setSelectedTestimonial] =
    useState<Testimonial | null>(null);
  const [key, setKey] = useState(0);

  const handleSuccess = () => {
    setSelectedTestimonial(null);
    setKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Testimonials</h3>
          <p className="text-sm text-muted-foreground">
            Manage customer testimonials that appear on the marketing page
          </p>
        </div>
        <Button
          onClick={() =>
            setSelectedTestimonial({
              id: '',
              author: '',
              role: '',
              content: '',
              approved: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
          }
        >
          Add New Testimonial
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>{/* Testimonial rows will be populated here */}</TableBody>
        </Table>
      </div>

      {selectedTestimonial && (
        <TestimonialForm
          testimonial={selectedTestimonial}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
