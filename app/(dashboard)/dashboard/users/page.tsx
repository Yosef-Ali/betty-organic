import { Suspense } from 'react';
import UserTable from '@/components/UserTable';
import { getUsers } from '@/app/actions/userActions';
import { ErrorBoundary } from 'react-error-boundary';
import React from 'react';
import ErrorFallbackComponent from '@/components/ErrorFallback';

function LoadingFallback() {
  return <div className="p-4">Loading users...</div>;
}

export default async function UsersPage({ initialUsers }: {
  initialUsers: {
    id: any;
    name: any;
    email: any;
    role: any;
    status: any;
    avatar_url: any;
  }[]
}) {
  try {
    const users = await getUsers();

    return (
      <div className="container mx-auto py-6">
        <h2 className="text-2xl font-bold mb-4">Users</h2>
        <ErrorBoundary FallbackComponent={ErrorFallbackComponent}>
          <Suspense fallback={<LoadingFallback />}>
            <UserTable initialUsers={users} />
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto py-6">
        <ErrorFallbackComponent
          error={
            error instanceof Error ? error : new Error('Failed to load users')
          }
        />
      </div>
    );
  }
}
