'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SettingsPage from './pages';

export default function DefaultSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/dashboard/settings/knowledge-base');
  }, [router]);

  return <SettingsPage />;
}
