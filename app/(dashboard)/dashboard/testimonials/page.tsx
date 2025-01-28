'use client';

import { TestimonialTable } from '@/components/testimonials/TestimonialTable';
import { DashboardShell } from '@/components/DashboardShell';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function TestimonialsPage() {
  return (
    <DashboardShell>
      <div className="flex-1 flex-col space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Testimonials</h2>
          <Link href="/dashboard/testimonials/new">
            <Button>Add New Testimonial</Button>
          </Link>
        </div>
        <div className="grid gap-4 grid-cols-1">
          <TestimonialTable />
        </div>
      </div>
    </DashboardShell>
  );
}
