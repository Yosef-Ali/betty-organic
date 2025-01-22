'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-10">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <MailCheck className="h-6 w-6 text-primary" />
            </div>
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a verification link to complete your signup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              Click the link in the email we sent you to verify your account. If
              you don&apos;t see it, check your spam folder.
            </p>
            <p>
              The link will expire in 24 hours. If you need a new verification
              link, you can sign in again to receive a new one.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button variant="outline" className="w-full" asChild>
            <Link href="/auth/login">Return to Sign In</Link>
          </Button>
          <div className="text-sm text-center text-muted-foreground">
            Didn&apos;t receive the email?{' '}
            <Button variant="link" className="p-0 h-auto font-normal" asChild>
              <Link href="/auth/login">Try signing in again</Link>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
