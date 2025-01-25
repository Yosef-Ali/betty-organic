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
import { useEffect, useState } from 'react';
import { UserButton } from './ui/user-button';
import { useToast } from '@/hooks/use-toast';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/lib/types/supabase';

export function NavigationClient() {
  const { toast } = useToast();
  const router = useRouter();
  const [cartItems] = useHydratedStore(
    useMarketingCartStore,
    state => state.items,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Initialize Supabase client
  const supabase = createClientComponentClient();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // Get initial session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          // Get user profile
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('Profile error:', profileError);
          } else {
            setProfile(profileData);
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Auth initialization error:', error);
        setIsLoading(false);
      }
    };

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        setProfile(profileData);
      } else {
        setProfile(null);
      }
    });

    initAuth();

    // Cleanup subscription when component unmounts
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      router.push('/auth/login');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error signing out',
        description: 'Please try again',
        variant: 'destructive',
      });
    }
  };

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

  return (
    <nav className="fixed top-0 z-50 w-full bg-[#ffc600]/80 backdrop-blur-md border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <MobileMenu user={user} profile={profile} />

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
                priority
              />
            </div>
            <span className="relative z-10 text-lg md:text-2xl">
              Betty&apos;s Organic
            </span>
            <div className="absolute -bottom-2 left-0 w-full h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgNGMxMCAwIDEwIDQgMjAgNHMxMC00IDIwLTQgMTAgNCAyMC00IDEwLTQgMjAtNCAxMCA0IDIwIDQgMTAtNCAyMC00IiBzdHJva2U9IiNlNjVmMDAiIGZpbGw9Im5vbmUiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3Zn>')] opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100 transition-all duration-300 origin-left z-0 bg-repeat-x" />
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
