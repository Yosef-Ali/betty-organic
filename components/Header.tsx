'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, PanelLeft } from 'lucide-react';
import { Button, buttonVariants } from 'components/ui/button';
import { Input } from 'components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'components/ui/dropdown-menu';
import {
  Home,
  ShoppingBag,
  ShoppingCart,
  Package,
  Users2,
  LineChart,
  Settings,
  Users,
} from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import { signOut } from '@/app/actions/auth';
import { Profile } from '@/lib/types/auth';
import { toast } from 'sonner';
import { NotificationBell } from './dashboard/NotificationBell';

interface HeaderProps {
  onMobileMenuToggle: () => void;
  profile?: Profile | null;
}

const allNavItems = [
  {
    href: '/dashboard/sales',
    icon: ShoppingBag,
    label: 'Sales',
    roles: ['sales'],
  },
  {
    href: '/dashboard/orders',
    icon: ShoppingCart,
    label: 'Orders',
    roles: ['sales'],
  },
  {
    href: '/dashboard/customers',
    icon: Users2,
    label: 'Customers',
    roles: ['sales'],
  },
  {
    href: '/dashboard/profile',
    icon: Users2,
    label: 'Profile',
    roles: ['admin', 'sales', 'customer'],
  },
  {
    href: '/dashboard/settings',
    icon: Settings,
    label: 'Settings',
    roles: ['admin'],
  },
  {
    href: '/dashboard/users',
    icon: Users,
    label: 'Users',
    roles: ['admin'],
  },
];

export default function Header({ onMobileMenuToggle, profile }: HeaderProps) {
  const filteredNavItems = allNavItems.filter(item =>
    item.roles.some(role => role === (profile?.role || 'customer')),
  );
  const pathname = usePathname();
  const router = useRouter();
  const [clientPathname, setClientPathname] = useState('');

  useEffect(() => {
    setClientPathname(pathname);
  }, [pathname]);

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    try {
      setIsSigningOut(true);
      console.log('Starting sign out process...');

      const { success, error, redirectTo } = await signOut();
      console.log('Sign out result:', { success, error, redirectTo });

      if (error) {
        console.error('Sign out failed:', error);
        toast.error('Failed to sign out. Please try again.');
        return;
      }

      // Use router for navigation if redirectTo is provided
      if (redirectTo) {
        router.push(redirectTo);
      } else {
        router.push('/auth/login');
      }
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  const generateBreadcrumbs = () => {
    if (!clientPathname || typeof clientPathname !== 'string') {
      return [{ label: 'Dashboard', href: null }];
    }

    const rawSegments = clientPathname.split('/').filter(Boolean);
    const pathSegments = rawSegments.map(segment =>
      String(segment).replace(/-/g, ' '),
    );

    if (pathSegments.length === 0) {
      return [{ label: 'Dashboard', href: null }];
    }

    // For mobile view, show only first and last segments if path depth > 2
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
    if (isMobile && pathSegments.length > 2) {
      const firstSegment = pathSegments[0];
      const lastSegment = pathSegments[pathSegments.length - 1];
      return [
        { label: firstSegment, href: `/${rawSegments[0]}` },
        { label: '...', href: null },
        { label: lastSegment, href: `/${rawSegments.slice(0, -1).join('/')}` },
      ];
    }

    return pathSegments.map((segment, index) => ({
      label: segment,
      href:
        index === pathSegments.length - 1
          ? null
          : `/${pathSegments.slice(0, index + 1).join('/')}`,
    }));
  };

  // Check if user is admin or sales based on profile role with more stable handling
  const isAdminOrSales = Boolean(profile?.role === 'admin' || profile?.role === 'sales');
  const [bellVisible, setBellVisible] = useState(false);

  // Use effect to prevent the notification bell from flickering
  useEffect(() => {
    if (isAdminOrSales && profile) {
      setBellVisible(true);
    }
  }, [isAdminOrSales, profile]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:p-6">
      <Button
        size="icon"
        variant="outline"
        className="sm:hidden"
        onClick={onMobileMenuToggle}
      >
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
      <Breadcrumb pathSegments={generateBreadcrumbs()} />

      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
        />
      </div>

      {/* NotificationBell for admin and sales users with stable visibility */}
      {bellVisible && (
        <div className="flex items-center gap-2">
          <NotificationBell />
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <Image
              src={profile?.avatar_url || '/placeholder-user.webp'}
              width={36}
              height={36}
              alt="Avatar"
              className="h-full w-full object-cover"
              priority
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {profile?.name || profile?.email}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? 'Signing out...' : 'Logout'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

interface DashboardHeaderProps {
  heading: string;
  text?: string;
  children?: React.ReactNode;
}

export function DashboardHeader({
  heading,
  text,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between px-2">
      <div className="grid gap-1">
        <h1 className="font-heading text-3xl md:text-4xl">{heading}</h1>
        {text && <p className="text-lg text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  );
}

