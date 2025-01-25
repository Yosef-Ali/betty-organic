'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Profile } from '@/lib/types/supabase';
import { User } from '@supabase/supabase-js';

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
    { href: '/', label: 'Home' },
    { href: '#products', label: 'Products' },
    { href: '#about', label: 'About' },
    { href: '#contact', label: 'Contact' },
  ];

  // Show dashboard for admin and sales roles
  if (profile?.role === 'admin' || profile?.role === 'sales') {
    links.push({ href: '/dashboard', label: 'Dashboard' });
  }

  // Profile link is available to all authenticated users
  if (user) {
    links.push({
      href: `/dashboard/profile?id=${profile?.id}`,
      label: 'Profile',
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
      <SheetContent side="left" className="w-[300px] sm:w-[400px]">
        <nav className="flex flex-col space-y-4 mt-4">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-lg font-medium transition-colors hover:text-primary"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
