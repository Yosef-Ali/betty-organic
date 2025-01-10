'use client';

import { useAuth } from 'lib/contexts/auth-context';
import ProfileForm from 'components/ProfileForm';
import { redirect } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <div className="max-w-2xl mx-auto">
        <ProfileForm user={user} />
      </div>
    </div>
  );
}
