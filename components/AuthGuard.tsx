'use client'

import { useSession } from './SessionProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !session) {
      router.push('/auth/signin')
    }
  }, [session, isLoading, router])

  if (isLoading || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return <>{children}</>
}
