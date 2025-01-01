'use client'

import SalesPage from '@/components/SalesPage'
import { Suspense } from 'react'

export default function ProductsPage() {
  return (

    <Suspense fallback={<div>Loading products...</div>}>
      <div className="flex-1 space-y-2 px-8">
        <h2 className="text-2xl font-bold mb-2">Sales Dashboard</h2>
      </div>
      <SalesPage />
    </Suspense>

  )
}
