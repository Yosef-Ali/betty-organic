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
} from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import { useAuthContext } from '@/contexts/auth/AuthContext';
import { signOut } from '@/app/auth/actions/authActions';

interface HeaderProps {
  onMobileMenuToggle: () => void;
}

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/sales', icon: ShoppingBag, label: 'Sales' },
  { href: '/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/products', icon: Package, label: 'Products' },
  { href: '/customers', icon: Users2, label: 'Customers' },
  { href: '/profile', icon: Users2, label: 'Profile' },
  { href: '/analytics', icon: LineChart, label: 'Analytics' },
  { href: '/settings', icon: Users2, label: 'Settings' },
];

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  const { profile, isAdmin } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();
  const [clientPathname, setClientPathname] = useState('');

  useEffect(() => {
    setClientPathname(pathname);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const generateBreadcrumbs = () => {
    if (!clientPathname || typeof clientPathname !== 'string') {
      return ['Dashboard'];
    }

    const rawSegments = clientPathname.split('/').filter(Boolean);
    const pathSegments = rawSegments.map(segment => segment.replace(/-/g, ' '));

    if (pathSegments.length === 0) {
      return ['Dashboard'];
    }

    return pathSegments.map((segment, index) => {
      const hrefSegments = rawSegments.slice(0, index + 1);
      if (index === 0 && hrefSegments[0].toLowerCase() === 'dashboard') {
        hrefSegments[0] = 'dashboard';
      }
      const href = '/' + hrefSegments.join('/');

      const label =
        navItems.find(item => item.href === href)?.label ||
        segment
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      return label;
    });
  };

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
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
