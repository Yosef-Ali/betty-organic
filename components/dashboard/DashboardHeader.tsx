"use client"
import { useState, useEffect } from 'react';
import { getRecentSales } from '../../app/actions/getRecentSales';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DollarSign, Users, CreditCard, Activity } from 'lucide-react';
import { User } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { DashboardCard } from '@/types/dashboard'
import { Button } from '../../components/ui/button'; // Import the Button component

export const dynamic = 'force-dynamic';


interface DashboardHeaderProps {
  user: User
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [cardData, setCardData] = useState<DashboardCard[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { recentSales, totalSales } = await getRecentSales();
      const newCardData: DashboardCard[] = [
        { title: 'Total Revenue', icon: DollarSign, value: `${totalSales.toFixed(2)} Br`, change: 'Calculated from all orders' },
        { title: 'Subscriptions', icon: Users, value: '0', change: 'Total number of customers' },
        { title: 'Sales', icon: CreditCard, value: recentSales.length.toString(), change: 'Total number of orders' },
        { title: 'Active Now', icon: Activity, value: '0', change: 'Users active in the last hour' },
      ]
      setCardData(newCardData)
    };

    fetchData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        {cardData.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
