'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, Home, Package, Info, Phone, LayoutDashboard, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

import { User } from '@supabase/supabase-js';
import { Profile } from '@/lib/types/auth';

interface MobileMenuProps {
  user?: User | null;
  profile?: Profile | null;
}

export function MobileMenu({
  user,
  profile,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render during server-side rendering
  if (!isClient) return null;

  const links = [
    { href: '/', label: 'Home', icon: <Home className="h-5 w-5" /> },
    { href: '#products', label: 'Products', icon: <Package className="h-5 w-5" /> },
    { href: '#about', label: 'About', icon: <Info className="h-5 w-5" /> },
    { href: '#contact', label: 'Contact', icon: <Phone className="h-5 w-5" /> },
  ];

  // Show dashboard for admin and sales roles
  if (profile?.role === 'admin' || profile?.role === 'sales') {
    links.push({ href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> });
  }

  // Profile link is available to all authenticated users
  if (user) {
    links.push({
      href: `/dashboard/profile?id=${profile?.id}`,
      label: 'Profile',
      icon: <UserCircle className="h-5 w-5" />
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="top" className="w-full h-[300px] bg-background/95 backdrop-blur-sm transition-transform duration-300 transform -translate-y-full data-[state=open]:translate-y-0 data-[state=closed]:-translate-y-full">
        <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
        <nav className="flex flex-col space-y-4 mt-4">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center space-x-3 text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setOpen(false)}
            >
              {link.icon}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
