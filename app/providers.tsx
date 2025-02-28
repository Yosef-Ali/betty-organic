'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { AppInitializer } from '@/components/AppInitializer';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <AppInitializer />
        {children}
      </TooltipProvider>
      <Toaster position="top-center" expand={true} richColors />
    </ThemeProvider>
  );
}
