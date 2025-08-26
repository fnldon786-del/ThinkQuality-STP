"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, AlertCircle } from "lucide-react"

export default function CustomerPendingPage() {
  // Mock data - replace with actual data fetching
  const pendingItems = [
    {
      id: 1,
      title: "Hydraulic System Repair",
      type: "Service Request",
      status: "awaiting_approval",
      date: "2024-12-15",
      description: "Waiting for approval to proceed with hydraulic system repairs",
    },
    {
      id: 2,
      title: "Monthly Maintenance Quote",
      type: "Quote",
      status: "pending_response",
      date: "2024-12-14",
      description: "Quote approval required for monthly maintenance services",
    },
  ]

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "awaiting_approval":
        return "bg-yellow-100 text-yellow-800"
      case "pending_response":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "awaiting_approval":
        return <Clock className="h-4 w-4" />
      case "pending_response":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout role="Customer">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Pending Items</h2>
          <p className="text-muted-foreground mt-2">Track pending approvals and responses</p>
        </div>

        <div className="space-y-4">
          {pendingItems.map((item) => (
            <Card key={item.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(item.status)}
                    <div>
                      <CardTitle className="text-lg">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusBadgeColor(item.status)}>{item.status.replace("_", " ")}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Type:</span> {item.type}
                  <span className="ml-4 font-medium">Date:</span> {new Date(item.date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {pendingItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No pending items at this time.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
