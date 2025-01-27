'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';

interface DashboardShellProps {
  children: React.ReactNode;
  isAdmin: boolean;
  isSales: boolean;
  isCustomer: boolean;
  profile?: {
    role?: string;
    name?: string;
    email?: string;
    avatar_url?: string;
  };
}

export function DashboardShell({
  children,
  isAdmin,
  isSales,
  isCustomer,
  profile,
}: DashboardShellProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={setSidebarExpanded}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
        isAdmin={isAdmin}
        isSales={isSales}
        isCustomer={isCustomer}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main
          className={`flex-1 overflow-y-auto transition-[margin] duration-300 ${isCustomer ? 'ml-60' : sidebarExpanded ? 'ml-60' : 'ml-14'
            }`}
        >
          <Header
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
            profile={profile}
          />
          <div className="container mx-auto">
            {children}
            <Toaster />
          </div>
        </main>
      </div>
    </div>
  );
}
