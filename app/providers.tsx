'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AppInitializer } from '@/components/AppInitializer';
import { AuthProvider } from '@/components/providers/AuthProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <AppInitializer />
          {children}
        </TooltipProvider>
      </AuthProvider>
      <Toaster position="top-center" expand={true} richColors />
    </ThemeProvider>
  );
}
