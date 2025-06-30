'use client';

import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface ProductHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
}

export function ProductHeader({ 
  title, 
  subtitle,
  showBackButton = true 
}: ProductHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col space-y-1 text-foreground">
      {showBackButton && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => router.push('/dashboard/products')}
          className="self-start -ml-2 mb-2 hover:bg-accent hover:text-accent-foreground">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Products
        </Button>
      )}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-muted-foreground text-lg">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
