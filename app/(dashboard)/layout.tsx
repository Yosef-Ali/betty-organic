import { getUser } from '@/app/actions/auth'; // Corrected import
import { getProfile } from '@/app/actions/profile'; // Import getProfile
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';
import { AuthProvider } from '@/components/providers/AuthProvider'; // Import AuthProvider

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await getUser(); // Use getUser
  const profile = user ? await getProfile(user.id) : null; // Fetch profile

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <AuthProvider user={user} profile={profile}>
      <DashboardShell role={profile?.role}>{children}</DashboardShell>
    </AuthProvider>
  );
}
