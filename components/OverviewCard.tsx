import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface OverviewCardProps {
  title: string
  value: string
  icon: React.ReactNode
  description?: string
}

export function OverviewCard({ title, value, icon, description }: OverviewCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs sm:text-sm font-medium truncate pr-2">{title}</CardTitle>
        <div className="flex-shrink-0">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold truncate" title={value}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 overflow-hidden"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}>
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

