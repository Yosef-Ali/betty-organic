import { LoginForm } from '@/components/authentication/login-form';
import { Metadata } from 'next';
import Image from 'next/image';

export const metadata: Metadata = {
  title: "Login | Betty's Organic",
  description: 'Login to your account',
};

export default function LoginPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0">
          <Image
            src="/pattern.svg"
            alt="Authentication background"
            fill
            className="block dark:hidden object-cover opacity-50"
          />
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium text-black dark:text-white">
          <Image
            src="/logo.jpeg"
            alt="Betty's Organic Logo"
            width={40}
            height={40}
            className="mr-2 rounded-full"
          />
          Betty&apos;s Organic
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg  text-black dark:text-white">
              &ldquo;Your trusted source for fresh, organic produce delivered
              right to your doorstep.&rdquo;
            </p>
            <footer className="text-sm text-muted-foreground">
              Betty Tadesse
            </footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
