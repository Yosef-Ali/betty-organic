'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false)

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar onToggle={setSidebarExpanded} />
      <div
        className={`flex flex-col sm:px-6 flex-1 transition-all duration-300 ${sidebarExpanded ? 'ml-60' : 'ml-14'
          }`}
      >
        {children}
      </div>
    </div>
  )
}