'use client';

import { Button } from '@/components/ui/button';

interface ProductHeaderProps {
  title: string;
  isLoading?: boolean;
}

export function ProductHeader({ title, isLoading }: ProductHeaderProps) {
  return (
    <div className="flex items-center justify-between space-x-4">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <div className="flex items-center space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button type="submit" form="product-form" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  );
}
