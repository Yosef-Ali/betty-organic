import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface OverviewCardProps {
  title: string
  value: string
  icon: React.ReactNode
}

export function OverviewCard({ title, value, icon }: OverviewCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

