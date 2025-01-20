import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { UserRole } from '@/app/auth/actions/authActions'
import { LoadingSpinner } from '@/components/ui/loading'

interface WithAuthOptions {
  roles?: UserRole[]
  redirectTo?: string
}

export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  return function WithAuthComponent(props: P) {
    const router = useRouter()
    const { checkAuth } = useAuth()
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
      const verifyAuth = async () => {
        try {
          const profile = await checkAuth()
          
          if (!profile) {
            router.push('/auth/login')
            return
          }

          if (options.roles && options.roles.length > 0) {
            const hasRole = options.roles.includes(profile.role)
            if (!hasRole) {
              router.push(options.redirectTo ?? '/dashboard')
              return
            }
          }

          setIsAuthorized(true)
        } catch (error) {
          console.error('Auth verification error:', error)
          router.push('/auth/login')
        } finally {
          setIsLoading(false)
        }
      }

      verifyAuth()
    }, [router, checkAuth, options.roles, options.redirectTo])

    if (isLoading) {
      return (
        <div className="flex h-screen w-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      )
    }

    if (!isAuthorized) {
      return null
    }

    return <WrappedComponent {...props} />
  }
}
