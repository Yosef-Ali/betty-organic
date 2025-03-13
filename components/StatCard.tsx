import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface StatCardProps {
  title: string
  value: string
  change: string
  changePercentage: number
}

export function StatCard({ title, value, change, changePercentage }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl sm:text-3xl font-bold truncate">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground truncate">
          {change}
        </div>
      </CardContent>
      <CardFooter>
        <Progress value={changePercentage} aria-label={`${changePercentage}% increase`} />
      </CardFooter>
    </Card>
  )
}
