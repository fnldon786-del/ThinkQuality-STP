import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MetricsCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  trend?: "up" | "down" | "neutral"
}

export function MetricsCard({ title, value, change, changeLabel, icon, trend = "neutral" }: MetricsCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600"
      case "down":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  const getTrendBadgeVariant = () => {
    switch (trend) {
      case "up":
        return "default"
      case "down":
        return "destructive"
      default:
        return "secondary"
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center space-x-2 text-xs">
            <Badge variant={getTrendBadgeVariant()}>
              {change > 0 ? "+" : ""}
              {change}%
            </Badge>
            <span className={getTrendColor()}>{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
