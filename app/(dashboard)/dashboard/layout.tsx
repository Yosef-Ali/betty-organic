import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient()
  
  // Get session and user in single query
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    redirect('/auth/login')
  }

  // Get user role from session
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role

  // Redirect if not admin or sales
  if (!role || !['admin', 'sales'].includes(role)) {
    redirect('/')
  }

  return <>{children}</>
}
