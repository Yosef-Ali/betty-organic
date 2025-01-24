'use client';

import type { Profile } from '@/types/supabase';

export default function ProfileDetails({ profile }: { profile: Profile }) {
  return (
    <div className="grid gap-3">
      <div className="font-semibold">Profile Information</div>
      <dl className="grid gap-3">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Customer</dt>
          <dd>{profile.full_name || 'Unknown Customer'}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Email</dt>
          <dd>
            <a
              href={`mailto:${profile.email}`}
              className="hover:underline"
              title={`Send email to ${profile.name}`}
            >
              {profile.email || 'N/A'}
            </a>
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Role</dt>
          <dd className="capitalize">{profile.role || 'N/A'}</dd>
        </div>
      </dl>
    </div>
  );
}
