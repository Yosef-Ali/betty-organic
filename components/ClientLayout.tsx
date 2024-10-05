'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from './Header';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Ensure that the sidebar and mobile menu states are only updated on the client
  useEffect(() => {
    // Any client-side only logic can go here
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={setSidebarExpanded}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />
      <div
        className={`flex flex-col sm:px-6 flex-1 transition-all duration-300 ${sidebarExpanded ? 'sm:ml-60' : 'sm:ml-14'
          }`}
      >
        <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
        {children}
      </div>
    </div>
  );
}
