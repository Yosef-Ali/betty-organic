import { cookies } from 'next/headers'
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
  const cookieStore = cookies()
  const authToken = cookieStore.get('sb-auth-token')

  return (
    <ProtectedRoute 
      initialAuthToken={authToken?.value}
      requireAdmin={requireAdmin}
      requireSales={requireSales}
      requireCustomer={requireCustomer}
    >
      {children}
    </ProtectedRoute>
  )
}
