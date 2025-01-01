'use client'

import { useState } from 'react'
import { DashboardHeader } from 'components/dashboard/DashboardHeader'
import Sidebar from 'components/Sidebar'
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
        <header className="border-b p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            {/* <DashboardHeader user={session.user} /> */}
          </div>
        </header>
        <main className="flex-1 p-4 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  )
}
