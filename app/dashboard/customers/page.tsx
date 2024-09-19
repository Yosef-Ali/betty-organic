import { CustomerTable } from '@/components/CustomerTable'
import { Suspense } from 'react'

export default function CustomersPage() {
  return (
    <div>
      <Suspense fallback={<div>Loading customers...</div>}>
        <CustomerTable />
      </Suspense>
    </div>
  )
}