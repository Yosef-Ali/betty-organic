'use client';

import { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
//import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  session: Session;
}

export default function DashboardLayoutClient({
  children,
  session,
}: DashboardLayoutClientProps) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        router.push('/auth/signin');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={setSidebarExpanded}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />
      <div
        className={`flex flex-col sm:px-6 flex-1 transition-all duration-300 ${
          sidebarExpanded ? 'sm:ml-60' : 'sm:ml-14'
        }`}
      >
        <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        {children}
      </div>
    </div>
  );
}
