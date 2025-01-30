'use client'

import { getUserById } from '@/app/actions/userActions'
import { notFound } from 'next/navigation'
import EditUserForm from '@/components/forms/EditUserForm'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { User } from '@supabase/supabase-js'

export default function EditUserPage() {
  const params = useParams()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (typeof params.id !== 'string') {
          throw new Error('Invalid user ID')
        }
        const userData = await getUserById(params.id)
        if (!userData) {
          notFound()
        }
        setUser(userData)
      } catch (err) {
        setError('Failed to load user')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [params.id])

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-4">Edit User</h2>
      {user && <EditUserForm user={user} />}
    </div>
  )
}
