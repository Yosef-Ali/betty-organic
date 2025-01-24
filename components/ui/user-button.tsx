'use client';

import { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutDashboard, User as UserIcon, LogOut } from 'lucide-react';

export interface UserButtonProps {
  user: User;
  profile?: {
    id: string;
    name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    role?: 'admin' | 'sales' | 'customer' | null;
  };
  onSignOut: () => Promise<void>;
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

export function UserButton({ user, profile, onSignOut }: UserButtonProps) {
  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger className="focus:outline-none">
          <Avatar className="h-8 w-8 border-2 border-primary hover:bg-primary/10 transition">
            {profile?.avatar_url ? (
              <AvatarImage
                src={profile.avatar_url}
                alt={profile.name || 'User'}
              />
            ) : (
              <AvatarFallback className="bg-primary text-white">
                {profile
                  ? getInitials(profile.name || profile.email || '')
                  : getInitials(user.email || '')}
              </AvatarFallback>
            )}
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-sm font-medium truncate">
              {profile?.name || user.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {profile?.role || 'User'}
            </p>
          </div>
          <DropdownMenuSeparator />
          {(profile?.role === 'admin' || profile?.role === 'sales') && (
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="w-full cursor-pointer">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link
              href={`/dashboard/profile?id=${profile?.id}`}
              className="w-full cursor-pointer"
            >
              <UserIcon className="mr-2 h-4 w-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onSignOut}
            className="text-red-600 cursor-pointer"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
