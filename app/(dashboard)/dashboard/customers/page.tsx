import { getCustomers } from '@/app/actions/customersActions'
import { CustomerTable } from '@/components/CustomerTable'

export default async function CustomersPage() {
  // Fetch and serialize customers data
  const customers = await getCustomers()
  const serializedCustomers = customers.map(customer => ({
    ...customer,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt?.toISOString(),
    orders: customer.orders?.map(order => ({
      ...order,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt?.toISOString()
    })) || []
  }))

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Customers</h2>
      <CustomerTable initialCustomers={serializedCustomers} />
    </div>
  )
}
