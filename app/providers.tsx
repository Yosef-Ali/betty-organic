'use client';

import { AuthProvider } from '@/lib/hooks/useAuth';

import { SupabaseProvider } from '@/lib/contexts/supabase-context'

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      {children}
    </AuthProvider>
  );
}
