import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';

export const dynamic = 'force-dynamic';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const authData = await getCurrentUser();

  if (!authData) {
    redirect('/auth/login');
  }

  return (
    <DashboardShell role={authData.profile.role}>{children}</DashboardShell>
  );
}
