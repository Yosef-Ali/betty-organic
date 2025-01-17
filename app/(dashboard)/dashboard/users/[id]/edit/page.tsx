'use server'

import { getUserById } from '@/app/actions/userActions'
import { notFound } from 'next/navigation'
import EditUserForm from '@/components/forms/EditUserForm'

interface Props {
  params: { id: string }
}

export default async function EditUserPage(props: Props) {
  const user = await getUserById(props.params.id)

  if (!user) {
    notFound()
  }

  return (
    <div className="container mx-auto py-6">
      <h2 className="text-2xl font-bold mb-4">Edit User</h2>
      <EditUserForm user={user} />
    </div>
  )
}
