import { getRecentSales } from '../../app/actions/getRecentSales';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { DollarSign, Users, CreditCard, Activity } from 'lucide-react';
import { User } from '@supabase/supabase-js'

interface DashboardHeaderProps {
  user: User
}

export async function DashboardHeader({ user }: DashboardHeaderProps) {
  const { recentSales, totalSales } = await getRecentSales();

  const cardData = [
    { title: 'Total Revenue', icon: DollarSign, value: `${totalSales.toFixed(2)} Br`, change: 'Calculated from all orders' },
    { title: 'Subscriptions', icon: Users, value: '0', change: 'Total number of customers' },
    { title: 'Sales', icon: CreditCard, value: recentSales.length.toString(), change: 'Total number of orders' },
    { title: 'Active Now', icon: Activity, value: '0', change: 'Users active in the last hour' },
  ];

  return (
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
  );
}
