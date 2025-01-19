"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { ShoppingCart, LayoutDashboard, Menu } from "lucide-react";
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useMarketingCartStore } from '../store/cartStore';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { MobileMenu } from "./MobileMenu";
import { useAuth } from "@/lib/hooks/useAuth";
import { useAuthContext } from "@/contexts/auth/AuthContext";
//import { useAuthContext } from '@/contexts/AuthContext';

interface NavigationProps { }

export default function Navigation({ }: NavigationProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const { isAuthenticated, user: authUser, isLoading: authLoading } = useAuth();
  const { isAdmin, loading: contextLoading, profile } = useAuthContext();  // Changed here
  const { items } = useMarketingCartStore();

  console.log('🧭 Navigation auth state:', {
    isAuthenticated,
    authLoading,
    contextLoading,
    isAdmin,
    userRole: profile?.role,  // Changed here
    userEmail: authUser?.email,
    userMetadata: authUser?.user_metadata
  });

  const handleSignIn = () => router.push('/auth/login');

  const handleSignOut = async () => {
    try {
      console.log('Initiating sign out...');

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // Redirect to login page
      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      // Ensure we redirect even if there's an error
      router.push('/auth/login');
      router.refresh();
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    const headerOffset = 80; // height of your fixed header
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Add this function to get the user's initials as fallback
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#ffc600]/80 backdrop-blur-md border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <MobileMenu user={authUser} /> {/* Changed from session to user */}

          {/* Logo */}
          <Link href="/" className="text-2xl md:text-2xl font-bold relative group flex items-center gap-2">
            <div className="relative w-8 h-8 md:w-10 md:h-10">
              <Image
                src="/logo.jpeg"
                alt="Betty's Organic Logo"
                fill
                className="rounded-full object-cover"
                sizes="(max-width: 768px) 32px, 40px"
              />
            </div>
            <span className="relative z-10 text-lg md:text-2xl">Betty&apos;s Organic</span>
            <div className="absolute -bottom-2 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNGMxMCAwIDEwIDQgMjAgNHMxMC00IDIwLTQgMTAgNCAyMC00IDEwLTQgMjAtNCAxMCA0IDIwIDQgMTAtNCAyMC00IiBzdHJva2U9IiNlNjVmMDAiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg==')] opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 origin-left z-0 bg-repeat-x" />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-lg font-medium relative group">
              <span className="relative z-10">Home</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link href="#products" className="text-lg font-medium relative group">
              <span className="relative z-10">Products</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link href="#about" className="text-lg font-medium relative group">
              <span className="relative z-10">About</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link href="#contact" className="text-lg font-medium relative group">
              <span className="relative z-10">Contact</span>
              <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {authLoading ? (
              <Button variant="ghost" disabled>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </Button>
            ) : authUser ? (
              <div className="flex items-center gap-4">
                {authUser && isAdmin && (
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
                      {authUser.user_metadata?.avatar_url ? (
                        <Image
                          src={authUser.user_metadata.avatar_url}
                          alt="User Avatar"
                          fill
                          className="object-cover"
                          priority
                          sizes="32px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary text-white text-sm font-medium">
                          {getInitials(authUser.email || '')}
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium">{authUser.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {authUser.user_metadata?.role || 'User'}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="w-full cursor-pointer">
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
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
              <Button
                variant="default"
                onClick={handleSignIn}
                className="hover:bg-primary/90"
              >
                Sign In
              </Button>
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
    </nav >
  );
}
