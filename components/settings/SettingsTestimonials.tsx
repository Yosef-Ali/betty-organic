'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function SettingsTestimonials() {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Testimonials</h3>
        <p className="text-sm text-muted-foreground">
          Manage customer testimonials that appear on the marketing page
        </p>
      </div>

      <div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings/testimonials">
            Manage Testimonials
          </Link>
        </Button>
      </div>
    </div>
  );
}
