'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getRecentSales } from '@/app/actions/supabase-actions'

type RecentSale = {
  id: string
  total_amount: number
  customers: {
    full_name: string
    email: string
  }
}

interface RecentSalesProps {
  data: any[]
}

export function RecentSales({ data }: RecentSalesProps) {
  const [recentSales, setRecentSales] = useState<RecentSale[]>([])

  useEffect(() => {
    async function fetchRecentSales() {
      const sales = await getRecentSales()
      setRecentSales(sales)
    }
    fetchRecentSales()
  }, [])

  return (
    <div className="space-y-8">
      {recentSales.map((sale) => (
        <div key={sale.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://avatar.vercel.sh/${sale.customers.email}.png`} alt={sale.customers.full_name} />
            <AvatarFallback>{sale.customers.full_name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.customers.full_name}</p>
            <p className="text-sm text-muted-foreground">
              {sale.customers.email}
            </p>
          </div>
          <div className="ml-auto font-medium">+${sale.total_amount.toFixed(2)}</div>
        </div>
      ))}
    </div>
  )
}

