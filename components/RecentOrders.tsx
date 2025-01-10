'use client'

import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getRecentOrders } from '@/app/actions/supabase-actions'

type RecentOrder = {
  id: string
  status: string
  total_amount: number
  type: string
  customers: {
    full_name: string
  }
}

interface RecentOrdersProps {
  data: any[]
}

export function RecentOrders({ data }: RecentOrdersProps) {
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])

  useEffect(() => {
    async function fetchRecentOrders() {
      const orders = await getRecentOrders()
      setRecentOrders(orders)
    }
    fetchRecentOrders()
  }, [])

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Order ID</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recentOrders.map((order) => (
          <TableRow key={order.id}>
            <TableCell className="font-medium">{order.id.slice(0, 8)}</TableCell>
            <TableCell>{order.customers.full_name}</TableCell>
            <TableCell>{order.status}</TableCell>
            <TableCell>{order.type}</TableCell>
            <TableCell className="text-right">${order.total_amount.toFixed(2)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

