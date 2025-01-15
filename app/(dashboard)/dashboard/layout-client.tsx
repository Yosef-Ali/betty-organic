'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { useUser } from '@/lib/hooks/useUser';
import { useRouter } from 'next/navigation';

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isSales, loading } = useUser();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAdmin && !isSales) {
      router.replace('/dashboard/profile');
    }
  }, [loading, isAdmin, isSales, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={setSidebarExpanded}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-col flex-1 overflow-hidden">
        <main className={`flex-1 overflow-y-auto transition-[margin] duration-300 ${sidebarExpanded ? 'ml-60' : 'ml-14'
          }`}>
          <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
