import { Suspense } from 'react'
import { CustomerTable } from '@/components/CustomerTable'

export default function CustomersPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Customers</h2>
      <Suspense fallback={<div>Loading customers...</div>}>
        <CustomerTable />
      </Suspense>
    </div>
  )
}
