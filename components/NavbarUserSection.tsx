'use client';

import { User } from '@supabase/supabase-js';
import { UserButton } from './UserButton';
import { cn } from '@/lib/utils';

interface NavbarUserSectionProps {
  user: User | null;
  profile?: { role?: string } | null;
}

export function NavbarUserSection({ user, profile }: NavbarUserSectionProps) {
  return (
    <nav
      className={cn(
        'flex items-center gap-4',
        'transition-opacity duration-200',
        user === undefined && 'opacity-0',
      )}
    >
      {user ? (
        <UserButton user={user} profile={profile} />
      ) : (
        <div className="flex items-center gap-4">
          <a
            href="/auth/login"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Sign In
          </a>
          <a
            href="/auth/signup"
            className="text-sm font-medium px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-all duration-200 active:scale-95"
          >
            Sign Up
          </a>
        </div>
      )}
    </nav>
  );
}
