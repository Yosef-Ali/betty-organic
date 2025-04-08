import { Suspense } from 'react';
import { getUser } from '@/app/actions/auth';
import { getProfile } from '@/app/actions/profile';
import { redirect } from 'next/navigation';
import SalesPage from '@/components/SalesPage';
import { SalesPageSkeleton } from '@/components/sales/SalesPageSkeleton';

export default async function SalesDashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Remove duplicate user fetch
  const profile = user ? await getProfile(user.id) : null; // Fetch profile using the user variable from line 8

  const formattedUser = {
    id: user.id, // Use the user variable from line 8
    user_metadata: {
      full_name: user.user_metadata?.full_name,
    },
    email: user.email,
    profile: {
      id: profile?.id,
      role: profile?.role,
    },
    isAdmin: profile?.role === 'admin',
  };

  return (
    <div className="flex-1 space-y-4 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Sales Dashboard</h2>
          <p className="text-muted-foreground">
            Manage sales and track inventory
          </p>
        </div>
      </div>
      <Suspense fallback={<SalesPageSkeleton />}>
        <SalesPage user={formattedUser} />
      </Suspense>
    </div>
  );
}
