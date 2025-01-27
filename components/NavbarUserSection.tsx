'use client';

import { User } from '@supabase/supabase-js';
import { UserButton } from './UserButton';
import { Button } from './ui/button';
import Link from 'next/link';

interface NavbarUserSectionProps {
  user: User | null | undefined;
  profile?: { role?: string } | null;
}

export function NavbarUserSection({ user, profile }: NavbarUserSectionProps) {
  if (user === undefined) {
    return null;
  }

  return (
    <nav className="flex items-center gap-4">
      {user ? (
        <UserButton user={user} profile={profile} />
      ) : (
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button>Sign Up</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
