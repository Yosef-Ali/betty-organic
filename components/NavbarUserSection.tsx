'use client';

import { UserButton } from './UserButton';
import { Button } from './ui/button';
import Link from 'next/link';
import { useAuth } from './providers/AuthProvider';

export function NavbarUserSection() {
  const { user, profile, isLoading } = useAuth();

  if (isLoading || user === undefined) {
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
