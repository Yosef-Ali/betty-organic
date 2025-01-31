'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Toaster } from '@/components/ui/toaster';

interface DashboardShellProps {
  children: React.ReactNode;
  role?: string;
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = role === 'admin';
  const isSales = role === 'sales';
  const isCustomer = role === 'customer';

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={setSidebarExpanded}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
        role={role}
      />
      <div className="flex flex-col flex-1 overflow-hidden">
        <main
          className={`flex-1 overflow-y-auto transition-[margin] duration-300 ${
            isCustomer ? 'ml-0 md:ml-60' : sidebarExpanded ? 'ml-0 md:ml-60' : 'ml-0 md:ml-14'
          }`}
        >
          <Header
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
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
