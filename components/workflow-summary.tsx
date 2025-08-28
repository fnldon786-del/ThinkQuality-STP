"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react"

interface WorkflowSummaryProps {
  role: "Admin" | "Technician" | "Customer"
  counts: {
    pending?: number
    inProgress?: number
    onHold?: number
    completed?: number
    urgent?: number
    overdue?: number
  }
}

export function WorkflowSummary({ role, counts }: WorkflowSummaryProps) {
  const summaryItems = [
    {
      label:
        role === "Admin" ? "Requests Waiting Approval" : role === "Technician" ? "Assigned Jobs" : "Pending Requests",
      count: counts.pending || 0,
      icon: Clock,
      color: "blue",
      urgent: false,
    },
    {
      label: role === "Admin" ? "Jobs In Progress" : role === "Technician" ? "Active Jobs" : "Jobs In Progress",
      count: counts.inProgress || 0,
      icon: AlertTriangle,
      color: "orange",
      urgent: false,
    },
    {
      label: "On Hold/Incomplete",
      count: counts.onHold || 0,
      icon: XCircle,
      color: "red",
      urgent: counts.onHold ? counts.onHold > 0 : false,
    },
    {
      label: role === "Admin" ? "Completed Today" : role === "Customer" ? "Completed This Week" : "Completed Jobs",
      count: counts.completed || 0,
      icon: CheckCircle,
      color: "green",
      urgent: false,
    },
  ]

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Workflow Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {summaryItems.map((item, index) => (
            <div key={index} className="text-center">
              <div
                className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                  item.color === "blue"
                    ? "bg-blue-100 text-blue-600"
                    : item.color === "orange"
                      ? "bg-orange-100 text-orange-600"
                      : item.color === "red"
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                }`}
              >
                <item.icon className="h-6 w-6" />
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl font-bold">{item.count}</span>
                {item.urgent && item.count > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    URGENT
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
