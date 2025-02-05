'use client';

import { Profile } from "@/lib/types/auth";

export default function CustomerDetails({ profile }: { profile?: Profile }) {
  // Display whatever information is available without strict checks

  return (
    <div className="grid gap-3">
      <div className="font-semibold">Customer Information</div>
      <dl className="grid gap-3">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Customer</dt>
          <dd>{profile.name || 'Unknown Customer'}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Email</dt>
          <dd>
            {profile.email ? (
              <a
                href={`mailto:${profile.email}`}
                className="hover:underline"
                title={`Send email to ${profile.name}`}
              >
                {profile.email}
              </a>
            ) : (
              'N/A'
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Role</dt>
          <dd className="capitalize">{profile.role || 'N/A'}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="capitalize">{profile.status || 'N/A'}</dd>
        </div>
      </dl>
    </div>
  );
}
