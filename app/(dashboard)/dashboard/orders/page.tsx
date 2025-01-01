
import OrderDashboard from '@/components/OrderDashboard'

import { Suspense } from 'react'

export default function OrdersDashboardPage() {

  return (
    <div>
      <Suspense fallback={<div>Loading orders...</div>}>
        <OrderDashboard />
      </Suspense>
    </div>
  )
}
