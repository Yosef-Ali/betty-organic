'use client';

import { Profile } from '@/lib/types/auth';

export default function CustomerDetails({ profile }: { profile?: Profile }) {
  // Create a default profile if none is provided
  const defaultProfile: Profile = {
    id: 'temp-id',
    name: 'Unknown Customer',
    email: 'No Email',
    role: 'customer',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Use the provided profile or fall back to default
  const customerProfile = profile || defaultProfile;

  return (
    <div className="grid gap-3">
      <div className="font-semibold">Customer Information</div>
      <dl className="grid gap-3">
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Customer</dt>
          <dd>{customerProfile.name}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Email</dt>
          <dd>
            {customerProfile.email && customerProfile.email !== 'No Email' ? (
              <a
                href={`mailto:${customerProfile.email}`}
                className="hover:underline"
                title={`Send email to ${customerProfile.name}`}
              >
                {customerProfile.email}
              </a>
            ) : (
              'N/A'
            )}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Role</dt>
          <dd className="capitalize">{customerProfile.role}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-muted-foreground">Status</dt>
          <dd className="capitalize">{customerProfile.status}</dd>
        </div>
      </dl>
    </div>
  );
}
