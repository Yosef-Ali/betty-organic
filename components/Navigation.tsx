'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { ShoppingCart, LayoutDashboard } from 'lucide-react';
import Image from 'next/image';
import { useMarketingCartStore } from '../store/cartStore';
import { useRouter } from 'next/navigation';
import { signOut } from '@/app/auth/actions/authActions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';
import { MobileMenu } from './MobileMenu';
import { useAuthContext } from '@/contexts/auth/AuthContext';
import { useEffect, useState } from 'react';

interface NavigationProps {}

export default function Navigation({}: NavigationProps) {
  const router = useRouter();
  const { isAdmin, loading, profile } = useAuthContext();
  const { items } = useMarketingCartStore();
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  const handleSignOut = async () => {
    try {
      // Clear local storage first
      localStorage.removeItem('userProfile');
      await signOut();
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Get user initials for avatar
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.substring(0, 2).toUpperCase();
  };

  // Don't render until after mount to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Show loading state
  if (loading) {
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

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#ffc600]/80 backdrop-blur-md border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <MobileMenu user={profile} />

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
            <div className="absolute -bottom-2 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNGMxMCAwIDEwIDQgMjAgNHMxMC00IDIwLTQgMTAgNCAyMC00IDEwLTQgMjAtNCAxMCA0IDIwIDQgMTAtNCAyMC00IiBzdHJva2U9IiNlNjVmMDAiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg==')] opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 origin-left z-0 bg-repeat-x" />
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
            {profile?.email ? (
              <div className="flex items-center gap-4">
                {isAdmin && (
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/dashboard')}
                    className="hidden md:flex gap-2"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-primary hover:bg-primary/10"
                    >
                      {profile.avatar_url ? (
                        <Image
                          src={profile.avatar_url}
                          alt="User Avatar"
                          fill
                          className="object-cover"
                          priority
                          sizes="32px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-white text-sm font-medium">
                          {getInitials(profile.name || profile.email)}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium truncate">
                        {profile.name || profile.email}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {profile.role}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/dashboard"
                          className="w-full cursor-pointer"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-600 cursor-pointer"
                    >
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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
                {items.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                    {items.length}
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
