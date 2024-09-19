
import OrderDashboard from '@/components/OrderDashboard'

import { Suspense } from 'react'

export default function CustomersPage() {

  return (
    <div>
      <Suspense fallback={<div>Loading customers...</div>}>
        <OrderDashboard />
      </Suspense>
    </div>
  )
}