"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface DashboardTileProps {
  title: string
  description: string
  icon: LucideIcon
  onClick: () => void
  color?: string
}

export function DashboardTile({ title, description, icon: Icon, onClick, color = "primary" }: DashboardTileProps) {
  const colorClasses = {
    primary: "hover:bg-primary/5 border-primary/20",
    blue: "hover:bg-blue-50 border-blue-200",
    green: "hover:bg-green-50 border-green-200",
    orange: "hover:bg-orange-50 border-orange-200",
    purple: "hover:bg-purple-50 border-purple-200",
    red: "hover:bg-red-50 border-red-200",
  }

  const iconColors = {
    primary: "text-primary",
    blue: "text-blue-600",
    green: "text-green-600",
    orange: "text-orange-600",
    purple: "text-purple-600",
    red: "text-red-600",
  }

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${colorClasses[color as keyof typeof colorClasses]} hover:shadow-md`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg bg-background ${iconColors[color as keyof typeof iconColors]}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
