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
  
  // Get session and user in single query
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    redirect('/auth/login')
  }

  // Get user role from session
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role

  // Check role requirements
  if ((requireAdmin && role !== 'admin') ||
      (requireSales && role !== 'sales') ||
      (requireCustomer && role !== 'customer')) {
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
