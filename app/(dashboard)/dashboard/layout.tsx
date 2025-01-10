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
      if (session) {
        // Check if user has admin role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role === 'admin') {
          redirect('/dashboard');
        }
      }
      redirect('/');
    }

    return <DashboardLayoutClient session={session}>{children}</DashboardLayoutClient>;
  } catch (error) {
    console.error('Layout error:', error);
    redirect('/auth/login');
  }
}
