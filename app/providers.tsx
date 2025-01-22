'use client';

import { AuthProvider } from '@/contexts/auth/AuthContext';
import { Toaster } from 'sonner';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-center" expand={true} richColors />
    </AuthProvider>
  );
}
