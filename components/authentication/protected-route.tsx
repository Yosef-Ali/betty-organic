import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/contexts/auth-context'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireSales?: boolean
}

export default function ProtectedRoute({
  children,
  requireAdmin = false,
  requireSales = false
}: ProtectedRouteProps) {
  const { user, isLoading, isAdmin, isSales } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/auth/signin');
      } else if (requireAdmin && !isAdmin) {
        router.replace('/');
      } else if (requireSales && !isSales && !isAdmin) {
        router.replace('/');
      } else if (user && !requireAdmin && !requireSales) {
        router.replace('/dashboard');
      }
    }
  }, [user, isLoading, isAdmin, isSales, requireAdmin, requireSales, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
