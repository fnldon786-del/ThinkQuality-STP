"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardTile } from "@/components/dashboard-tile"
import { WorkflowMetrics } from "@/components/workflow-metrics"
import { IncompleteJobsList } from "@/components/incomplete-jobs-list"
import { createClient } from "@/lib/supabase/client"
import { FileText, MessageSquare, BarChart3, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function CustomerDashboard() {
  const router = useRouter()
  const [userId, setUserId] = useState<string>("")
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
      }
    }
    getUser()
  }, [])

  const customerTiles = [
    {
      title: "My Requests",
      description: "View your service requests and their status",
      icon: FileText,
      color: "primary",
      onClick: () => router.push("/customer/requests"),
    },
    {
      title: "Submit Request",
      description: "Submit a new service or maintenance request",
      icon: MessageSquare,
      color: "green",
      onClick: () => router.push("/customer/requests/create"),
    },
    {
      title: "Service Reports",
      description: "View completed service reports and documentation",
      icon: BarChart3,
      color: "blue",
      onClick: () => router.push("/customer/reports"),
    },
    {
      title: "Pending Items",
      description: "Track pending approvals and responses",
      icon: Clock,
      color: "orange",
      onClick: () => router.push("/customer/pending"),
    },
    {
      title: "Completed Work",
      description: "Review completed maintenance and service work",
      icon: CheckCircle,
      color: "green",
      onClick: () => router.push("/customer/completed"),
    },
    {
      title: "Issues & Feedback",
      description: "Report issues or provide feedback on services",
      icon: AlertCircle,
      color: "red",
      onClick: () => router.push("/customer/feedback"),
    },
  ]

  return (
    <DashboardLayout role="Customer">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Customer Dashboard</h2>
          <p className="text-muted-foreground mt-2">Track your service requests and view maintenance reports</p>
        </div>

        {userId && <WorkflowMetrics role="Customer" userId={userId} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customerTiles.map((tile, index) => (
                <DashboardTile
                  key={index}
                  title={tile.title}
                  description={tile.description}
                  icon={tile.icon}
                  color={tile.color}
                  onClick={tile.onClick}
                />
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            {userId && <IncompleteJobsList role="Customer" userId={userId} limit={6} />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
