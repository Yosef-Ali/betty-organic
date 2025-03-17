'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signIn, signInWithGoogle } from '@/app/actions/auth';
import Link from 'next/link';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters',
  }),
});

type FormData = z.infer<typeof formSchema>;

interface LoginFormProps {
  returnTo?: string | null;
  isLoading?: boolean;
  setIsLoading?: (isLoading: boolean) => void;
}

export function LoginForm({ returnTo, isLoading, setIsLoading }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = React.useState(isLoading || false);
  const [authError, setAuthError] = React.useState<string | null>(null);

  // Extract error messages from URL
  React.useEffect(() => {
    const error = searchParams.get('error');
    if (error === 'account_inactive') {
      setAuthError('Your account has been deactivated. Please contact support.');
    } else if (error) {
      setAuthError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (formData: FormData) => {
    setAuthError(null);
    setIsPending(true);
    if (setIsLoading) setIsLoading(true);

    try {
      const data = new FormData();
      data.append('email', formData.email);
      data.append('password', formData.password);
      const result = await signIn(data);

      if (result.error) {
        toast.error(result.error);
        setAuthError(result.error);
        setIsPending(false);
        if (setIsLoading) setIsLoading(false);
        return;
      }

      if (result.success) {
        // If there's a returnTo URL, use it, otherwise use the default redirect
        const redirectUrl = returnTo || (result.redirect?.destination || '/dashboard');
        router.push(redirectUrl);
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(errorMessage);
      setAuthError(errorMessage);
      setIsPending(false);
      if (setIsLoading) setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthError(null);
      setIsPending(true);
      if (setIsLoading) setIsLoading(true);

      const result = await signInWithGoogle(returnTo || undefined);

      if (result.error) {
        console.error('Google sign in error:', result.error);
        toast.error(`Sign in failed: ${result.error}`);
        setAuthError(result.error);
        setIsPending(false);
        if (setIsLoading) setIsLoading(false);
        return;
      }

      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error('Authentication configuration error');
        setAuthError('Authentication configuration error');
        setIsPending(false);
        if (setIsLoading) setIsLoading(false);
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during Google sign in';
      toast.error(errorMessage);
      setAuthError(errorMessage);
      setIsPending(false);
      if (setIsLoading) setIsLoading(false);
    }
  };

  return (
    <div className="grid gap-6">
      {authError && (
        <Alert variant="destructive" className="animate-in fade-in-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="name@example.com" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-center text-sm">
        <Link
          href="/auth/reset-password"
          className="text-primary hover:underline"
        >
          Forgot password?
        </Link>
      </div>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-2"
        onClick={handleGoogleSignIn}
        disabled={isPending}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      <div className="text-center text-sm">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
}
