import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { code?: string; message?: string };
}) {
  const errorMessage = searchParams.message || 'An unexpected error occurred';
  const errorCode = searchParams.code || '500';

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Authentication Error
          </h1>
          <p className="text-sm text-muted-foreground">
            Error code: {errorCode}
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {decodeURIComponent(errorMessage)}
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/auth/login">Return to login</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Go to homepage</Link>
          </Button>
        </div>

        {/* Support section */}
        <p className="px-8 text-center text-sm text-muted-foreground">
          Need help?{' '}
          <Link
            href="mailto:support@example.com"
            className="hover:text-brand underline underline-offset-4"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
