'use client'

import { createContext, useContext, ReactNode } from 'react'

interface DashboardContextType {
  sales?: any
  transactions?: any
  products?: any
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children, value }: { children: ReactNode, value: DashboardContextType }) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
