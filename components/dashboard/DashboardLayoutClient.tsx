// app/(dashboard)/dashboard/DashboardLayoutClient.tsx
'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import Sidebar from '@/components/Sidebar'
import { Session } from '@supabase/auth-helpers-nextjs';

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function DashboardLayoutClient({ children, session }: DashboardLayoutClientProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!session) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={setSidebarExpanded}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex flex-col flex-1">
        <DashboardHeader user={session.user} />
        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  )
}
