import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient';

export const revalidate = 0;

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient();

  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error || !session) {
      redirect('/auth/login');
    }

    return <DashboardLayoutClient session={session}>{children}</DashboardLayoutClient>;
  } catch (error) {
    console.error('Layout error:', error);
    redirect('/auth/login');
  }
}
