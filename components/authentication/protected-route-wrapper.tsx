'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/lib/hooks/useAuth'

export default function ProtectedRouteWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
    }
  }, [session, router])

  return <>{children}</>
}
