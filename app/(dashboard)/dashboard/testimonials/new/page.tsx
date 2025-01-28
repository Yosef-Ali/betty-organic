'use client';

import { TestimonialForm } from '@/components/testimonials/TestimonialForm';
import { DashboardShell } from '@/components/DashboardShell';

export default function NewTestimonialPage() {
  return (
    <DashboardShell>
      <div className="flex-1 flex-col space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Add New Testimonial</h2>
        </div>
        <div className="grid gap-4 grid-cols-1">
          <TestimonialForm />
        </div>
      </div>
    </DashboardShell>
  );
}
