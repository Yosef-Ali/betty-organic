
import { OrderDetails } from '@/components/OrderDetails'
import { Suspense } from 'react'

export default function OrdersPage() {

  return (
    <div>
      <Suspense fallback={<div>Loading Orders...</div>}>
        <OrderDetails />
      </Suspense>
    </div>
  )
}
