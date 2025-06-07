'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AppInitializer } from '@/components/AppInitializer';
import { RealtimeProvider } from '@/lib/supabase/realtime-provider';
import { useAuth } from '@/components/providers/ImprovedAuthProvider';

function RealtimeWrapper({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();

  return (
    <RealtimeProvider
      userId={user?.id}
      userRole={profile?.role as 'admin' | 'sales' | 'customer'}
    >
      {children}
    </RealtimeProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <RealtimeWrapper>
        <TooltipProvider>
          <AppInitializer />
          {children}
        </TooltipProvider>
      </RealtimeWrapper>
      <Toaster position="top-center" expand={true} richColors />
    </ThemeProvider>
  );
}
