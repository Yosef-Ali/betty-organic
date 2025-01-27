import { getCurrentUser } from '@/app/actions/auth';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/components/DashboardShell';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const { user, isAdmin, profile } = await getCurrentUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const isSales = profile?.role === 'sales';
  const isCustomer = profile?.role === 'customer';

  return (
    <DashboardShell isAdmin={isAdmin} isSales={isSales} isCustomer={isCustomer}>
      {children}
    </DashboardShell>
  );
}
