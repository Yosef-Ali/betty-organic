'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import Sidebar from '@/components/Sidebar'
import { Session } from '@supabase/auth-helpers-nextjs'
import Header from '@/components/Header'

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  session: Session | null;
}

export default function DashboardLayoutClient({ children, session }: DashboardLayoutClientProps) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!session) return null;

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
  )
}
