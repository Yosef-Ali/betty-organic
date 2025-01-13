"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { ShoppingCart, LayoutDashboard, Menu } from "lucide-react";
import Image from 'next/image';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useState } from 'react';
import { useCartStore } from '../store/cartStore';
import { useRouter } from 'next/navigation';
import type { Session, User } from '@supabase/auth-helpers-nextjs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { MobileMenu } from "./MobileMenu";
import { useAuth } from '@/lib/hooks/useAuth'; // Ensure correct import


interface NavigationProps { }

export default function Navigation({ }: NavigationProps) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { items } = useCartStore();

  useEffect(() => {
    const getUser = async () => {
      try {
        // Get the current session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session:', session); // Debug log

        if (error) {
          throw error;
        }

        if (session?.user) {
          setUser(session.user);
          console.log('Setting user from session:', session.user);
        }

        // Set up auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth event:', event); // Debug log
            console.log('New session:', session); // Debug log

            if (session?.user) {
              setUser(session.user);
            } else {
              setUser(null);
            }
          }
        );

        setLoading(false);
        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Error in auth:', error);
        setLoading(false);
      }
    };

    getUser();
  }, [supabase]);

  const handleSignIn = () => router.push('/auth/login');

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
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

  console.log('Current user state:', user); // Debug log

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#ffc600]/80 backdrop-blur-md border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <MobileMenu user={user} /> {/* Changed from session to user */}

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
            {loading ? (
              <Button variant="ghost" disabled>Loading...</Button>
            ) : user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full overflow-hidden border-2 border-primary"
                    >
                      <Image
                        src={user.user_metadata?.avatar_url || "/placeholder-user.webp"}
                        alt="User Avatar"
                        fill
                        className="object-cover"
                        priority
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem disabled className="font-medium">
                      {user.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button variant="default" onClick={handleSignIn}>
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
