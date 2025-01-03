import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import DashboardLayoutClient from '@/components/dashboard/DashboardLayoutClient';
import { redirect } from 'next/navigation';

export const revalidate = 0;

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error || !session) {
      redirect('/auth/signin');
    }

    return <DashboardLayoutClient session={session}>{children}</DashboardLayoutClient>;
  } catch (error) {
    console.error('Layout error:', error);
    redirect('/auth/signin');
  }
}
