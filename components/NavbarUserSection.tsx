'use client';

import { UserButton } from './UserButton';
import { Button } from './ui/button';
import Link from 'next/link';
import { User } from '@supabase/supabase-js';
import { Profile } from '@/lib/types/auth';

interface NavbarUserSectionProps {
  user: User | null;
  profile: Profile | null;
}

export function NavbarUserSection({ user, profile }: NavbarUserSectionProps) {
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
