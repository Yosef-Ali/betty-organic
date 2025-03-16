'use client';

import { LoginForm } from '@/components/authentication/login-form';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export const metadata: Metadata = {
  title: "Login | Betty's Organic",
  description: 'Login to your account',
};

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <Link
          href="/"
          className="relative z-20 flex items-center text-lg font-medium"
        >
          <Image
            src="/logo.png"
            alt="Betty's Organic"
            width={40}
            height={40}
            className="mr-2"
          />
          Betty&apos;s Organic
        </Link>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Fresh organic fruits and vegetables delivered to your
              door.&rdquo;
            </p>
            <footer className="text-sm">Betty&apos;s Organic</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your email to sign in to your account
            </p>
          </div>
          <LoginForm returnTo={returnTo} />
        </div>
      </div>
    </div>
  );
}
