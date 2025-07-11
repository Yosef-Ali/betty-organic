'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
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
import { ChevronLeft } from 'lucide-react';

const formSchema = z.object({
  email: z.string().email({
    message: 'Please enter a valid email address',
  }),
  password: z.string().min(6, {
    message: 'Password must be at least 6 characters',
  }),
});

type FormData = z.infer<typeof formSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (formData: FormData) => {
    setIsPending(true);

    try {
      const data = new FormData();
      data.append('email', formData.email);
      data.append('password', formData.password);
      const result = await signIn(data);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      if (result.success && result.redirect) {
        router.push(result.redirect.destination);
      } else if (result.success) {
        router.push('/dashboard');
      } else {
        toast.error('Sign in failed');
      }
    } catch (error) {
      let errorMessage = 'An unexpected error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Enhanced error object handling
        if ('message' in error) {
          errorMessage = String(error.message);
        } else if (Object.keys(error).length === 0) {
          // Handle empty error object case
          errorMessage = 'Authentication failed. Please check your credentials and try again.';
        } else {
          // If error object has content but no message property
          errorMessage = `Authentication failed: ${JSON.stringify(error)}`;
        }
      }

      toast.error(errorMessage);
      // Enhanced error logging with more context
      console.error('Login error:', {
        error,
        errorMessage,
        timestamp: new Date().toISOString(),
        path: window.location.pathname,
        type: typeof error,
        isEmpty: error instanceof Object ? Object.keys(error).length === 0 : false
      });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="p-6 space-y-4 bg-card rounded-lg border shadow-sm">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mr-2 h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isPending}
                    {...field}
                  />
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
                  <Input
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    disabled={isPending}
                    {...field}
                  />
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
            Don&apos;t have an account?
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Button
          type="button"
          variant="outline"
          className="w-full flex items-center justify-center gap-2"
          onClick={async () => {
            try {
              setIsPending(true);
              // Use production URL in production, localhost in development
              const origin = process.env.NODE_ENV === 'production' 
                ? 'https://bettys-organic.com' 
                : window.location.origin;
              const result = await signInWithGoogle(origin); // Pass origin
              if (result.error) {
                console.error('Google sign in error:', result.error);
                toast.error(`Sign in failed: ${result.error}`);
                return;
              }
              if (result.url) {
                window.location.href = result.url;
              } else {
                toast.error('No redirect URL received');
              }
            } catch (error) {
              console.error('Google sign in error:', error);
              toast.error(
                'An error occurred during Google sign in. Please try again.',
              );
            } finally {
              setIsPending(false);
            }
          }}
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

        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push('/auth/signup')}
        >
          Create an account
        </Button>
      </div>
    </div>
  );
}
