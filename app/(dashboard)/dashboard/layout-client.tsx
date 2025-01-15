'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Skeleton } from "@/components/ui/skeleton";
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
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-8 w-[200px]" />
        </div>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[110px] rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
            <div className="col-span-4">
              <Skeleton className="h-[400px] rounded-lg" />
            </div>
            <div className="col-span-3">
              <Skeleton className="h-[400px] rounded-lg" />
            </div>
          </div>
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
