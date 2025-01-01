import { Suspense } from 'react'
import { UserTable } from '@/components/UserTable'
import { getUsers } from '@/app/actions/userActions'

export default async function UsersPage() {
  const initialUsers = await getUsers();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Users</h2>
      <Suspense fallback={<div>Loading users...</div>}>
        <UserTable initialUsers={initialUsers} />
      </Suspense>
    </div>
  )
}
