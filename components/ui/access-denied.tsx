import { Button } from '@/components/ui/button';
import { ShieldX, Home } from 'lucide-react';
import Link from 'next/link';

interface AccessDeniedProps {
  message: string;
  showHomeButton?: boolean;
}

export function AccessDenied({ message, showHomeButton = false }: AccessDeniedProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <ShieldX className="h-16 w-16 text-muted-foreground mb-4" />
      <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      {showHomeButton && (
        <Button asChild>
          <Link href="/dashboard">
            <Home className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Link>
        </Button>
      )}
    </div>
  );
}
