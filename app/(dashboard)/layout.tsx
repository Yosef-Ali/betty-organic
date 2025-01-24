'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthContext } from '@/contexts/auth/AuthContext';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

const CUSTOMER_ACCESSIBLE_ROUTES = ['/dashboard/profile', '/dashboard/orders'];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, isSales, loading, profile } = useAuthContext();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  console.log('📊 Dashboard Auth State:', {
    isAdmin,
    isSales,
    loading,
    userRole: profile?.role,
    pathname,
  });

  useEffect(() => {
    if (!loading) {
      // Allow all authenticated users to access customer routes
      const isCustomerRoute = CUSTOMER_ACCESSIBLE_ROUTES.includes(pathname);

      // Restrict admin-only routes
      const isAdminRoute = pathname.startsWith('/dashboard');
      if (isAdminRoute && !isAdmin) {
        console.log('🚫 Unauthorized access attempt - redirecting to profile');
        router.replace('/dashboard/profile');
      }
    }
  }, [isAdmin, isSales, loading, pathname, router]);

  // Show loading state while checking permissions
  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-8 w-[200px]" />
        </div>
      </div>
    );
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
        <main
          className={`flex-1 overflow-y-auto transition-[margin] duration-300 ${
            sidebarExpanded ? 'ml-60' : 'ml-14'
          }`}
        >
          <Header
            onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
          <div className="container mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
