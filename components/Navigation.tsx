'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ShoppingCart, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { useMarketingCartStore } from '../store/cartStore';
import { useHydratedStore } from '@/hooks/useHydratedStore';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/auth/actions/authActions';
import { Badge } from './ui/badge';
import { MobileMenu } from './MobileMenu';
import { useAuthContext } from '@/contexts/auth/AuthContext';
import { useEffect, useState } from 'react';
import { UserButton } from './ui/user-button';
import { useToast } from '@/hooks/use-toast';

export default function Navigation() {
  const { toast } = useToast();
  const router = useRouter();
  const { isLoading, profile, user, error } = useAuthContext();
  const [cartItems] = useHydratedStore(
    useMarketingCartStore,
    state => state.items,
  );

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []); // Run once on mount

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/auth/login');
      router.refresh(); // Ensure page state is cleared
    } catch (error) {
      console.error('Sign out error:', error);
      // Add toast notification for error
      toast({
        title: 'Error signing out',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

  // Handle client-side rendering and loading states
  if (!isClient) return null;

  if (isLoading) {
    return (
      <nav className="fixed top-0 z-50 w-full bg-[#ffc600]/80 backdrop-blur-md border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="w-full flex justify-center">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        </div>
      </nav>
    );
  }

  if (error) {
    return (
      <nav className="fixed top-0 z-50 w-full bg-destructive/10 backdrop-blur-md border-b border-destructive/20">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="w-full flex justify-center text-destructive">
            {error}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#ffc600]/80 backdrop-blur-md border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <MobileMenu />

          <Link
            href="/"
            className="text-2xl md:text-2xl font-bold relative group flex items-center gap-2"
          >
            <div className="relative w-8 h-8 md:w-10 md:h-10">
              <Image
                src="/logo.jpeg"
                alt="Betty's Organic Logo"
                fill
                className="rounded-full object-cover"
                sizes="(max-width: 768px) 32px, 40px"
              />
            </div>
            <span className="relative z-10 text-lg md:text-2xl">
              Betty&apos;s Organic
            </span>
            <div className="absolute -bottom-2 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNGMxMCAwIDEwIDQgMjAgNHMxMC00IDIwLTQgMTAgNCAyMC00IDEwLTQgMjAtNCAxMCA0IDIwIDQgMTAtNCAyMC00IiBzdHJva2U9IiNlNjVmMDAiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg==')] opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 origin-left z-0 bg-repeat-x"></div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-lg font-medium relative group">
              <span className="relative z-10">Home</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="#products"
              className="text-lg font-medium relative group"
            >
              <span className="relative z-10">Products</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link href="#about" className="text-lg font-medium relative group">
              <span className="relative z-10">About</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              href="#contact"
              className="text-lg font-medium relative group"
            >
              <span className="relative z-10">Contact</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-4">
                {(profile?.role === 'admin' || profile?.role === 'sales') && (
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard')}
                    className="hidden md:flex gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                )}
                <UserButton
                  user={user}
                  profile={profile}
                  onSignOut={handleSignOut}
                />
              </div>
            ) : (
              <Link href="/auth/login">
                <Button variant="outline" className="hover:bg-primary/10">
                  Sign In
                </Button>
              </Link>
            )}

            <Link href="/cart">
              <Button size="icon" variant="ghost" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartItems.length > 0 && (
                  <Badge
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
                    aria-label={`${cartItems.length} items in cart`}
                  >
                    {cartItems.length}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
