'use client'

import { useEffect, useState } from 'react'
import { getOrders } from '@/app/actions/orderActions'

interface Order {
  id: string
  products: string[]
  status: string
  created_at: string
}

export function OrderStatus() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrders()
        setOrders(data)
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Failed to fetch orders')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  if (loading) return <div>Loading orders...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Order Status</h2>
      <div className="space-y-2">
        {orders.map(order => (
          <div key={order.id} className="p-4 border rounded">
            <div className="flex justify-between">
              <span>Order #{order.id.slice(0, 8)}</span>
              <span className={`badge ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Created: {new Date(order.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'processing':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'cancelled':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
