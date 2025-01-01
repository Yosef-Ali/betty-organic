import { notFound } from 'next/navigation';
import { EditUserForm } from '@/components/EditUserForm';
import { getUserById } from '@/app/actions/userActions';

export default async function EditUserPage({ params }: { params: { id: string } }) {
  const user = await getUserById(params.id);

  if (!user) {
    notFound();
  }

  const isValidRole = (role: string): role is 'admin' | 'user' => {
    return role === 'admin' || role === 'user';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Edit User</h2>
      <EditUserForm
        initialData={{
          id: user.id,
          name: user.name || user.full_name || '',
          email: user.email,
          role: isValidRole(user.role) ? user.role : 'user',
          status: user.status as 'active' | 'inactive',
        }}
      />
    </div>
  );
}
