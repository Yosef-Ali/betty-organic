import { Suspense } from 'react'
import { UserTable } from '@/components/UserTable'
import { getUsers } from '@/app/actions/userActions'
import { ErrorBoundary } from 'react-error-boundary'
import React from 'react'
import ProtectedRoute from '@/components/authentication/protected-route'

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 text-red-500">
      <h2 className="text-lg font-bold">Something went wrong:</h2>
      <pre className="mt-2 text-sm">{error.message}</pre>
    </div>
  )
}

function LoadingFallback() {
  return <div className="p-4">Loading users...</div>
}

export default async function UsersPage() {
  try {
    const initialUsers = await getUsers()

    return (
      <ProtectedRoute requireAdmin>
        <div className="container mx-auto py-6">
          <h2 className="text-2xl font-bold mb-4">Users</h2>
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<LoadingFallback />}>
              <UserTable initialUsers={initialUsers} />
            </Suspense>
          </ErrorBoundary>
        </div>
      </ProtectedRoute>
    )
  } catch (error) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="container mx-auto py-6">
          <ErrorFallback error={error instanceof Error ? error : new Error('Failed to load users')} />
        </div>
      </ProtectedRoute>
    )
  }
}
