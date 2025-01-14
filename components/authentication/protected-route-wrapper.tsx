import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProtectedRoute from './protected-route'

interface ProtectedRouteWrapperProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireSales?: boolean
  requireCustomer?: boolean
}

export default async function ProtectedRouteWrapper({
  children,
  requireAdmin = false,
  requireSales = false,
  requireCustomer = false
}: ProtectedRouteWrapperProps) {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  // Check role requirements
  if ((requireAdmin && profile?.role !== 'admin') ||
      (requireSales && profile?.role !== 'sales') ||
      (requireCustomer && profile?.role !== 'customer')) {
    redirect('/')
  }

  return (
    <ProtectedRoute 
      requireAdmin={requireAdmin}
      requireSales={requireSales}
      requireCustomer={requireCustomer}
    >
      {children}
    </ProtectedRoute>
  )
}
