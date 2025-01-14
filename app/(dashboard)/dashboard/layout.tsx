import { createServerComponentSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerComponentSupabaseClient({
    headers,
    cookies,
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth/login');
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  // Redirect if not admin
  if (!profile?.role || !['admin', 'sales'].includes(profile.role)) {
    redirect('/');
  }

  return <>{children}</>;
}
