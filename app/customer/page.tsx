"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardTile } from "@/components/dashboard-tile"
import { WorkflowSummary } from "@/components/workflow-summary"
import { FileText, MessageSquare, BarChart3, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function CustomerDashboard() {
  const router = useRouter()
  const [workflowCounts, setWorkflowCounts] = useState({
    pendingRequests: 0,
    pendingJobCards: 0,
    onHold: 0,
    maintenanceDue: 0,
    completedWeek: 0,
    issues: 0,
  })

  useEffect(() => {
    const fetchWorkflowCounts = async () => {
      const supabase = createClient()

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase.from("profiles").select("company_name").eq("id", user.id).single()

        if (!profile?.company_name) return

        const [
          { count: pendingRequests },
          { count: pendingJobCards },
          { count: onHoldJobs },
          { count: maintenanceDue },
          { count: completedWeek },
          { count: issues },
        ] = await Promise.all([
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .eq("customer_company", profile.company_name)
            .eq("status", "pending"),
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .eq("customer_company", profile.company_name)
            .in("status", ["approved", "assigned"]),
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .eq("customer_company", profile.company_name)
            .in("status", ["on_hold", "incomplete"]),
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .eq("customer_company", profile.company_name)
            .eq("type", "maintenance")
            .lte("due_date", new Date().toISOString()),
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .eq("customer_company", profile.company_name)
            .eq("status", "completed")
            .gte("completed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .eq("customer_company", profile.company_name)
            .eq("priority", "urgent"),
        ])

        setWorkflowCounts({
          pendingRequests: pendingRequests || 0,
          pendingJobCards: pendingJobCards || 0,
          onHold: onHoldJobs || 0,
          maintenanceDue: maintenanceDue || 0,
          completedWeek: completedWeek || 0,
          issues: issues || 0,
        })
      } catch (error) {
        console.error("Error fetching workflow counts:", error)
      }
    }

    fetchWorkflowCounts()
  }, [])

  const customerTiles = [
    {
      title: "My Requests",
      description: "View your service requests and their status",
      icon: FileText,
      color: "primary",
      count: workflowCounts.pendingRequests,
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
      count: workflowCounts.pendingJobCards,
      onClick: () => router.push("/customer/pending"),
    },
    {
      title: "Completed Work",
      description: "Review completed maintenance and service work",
      icon: CheckCircle,
      color: "green",
      count: workflowCounts.completedWeek,
      onClick: () => router.push("/customer/completed"),
    },
    {
      title: "Issues & Feedback",
      description: "Report issues or provide feedback on services",
      icon: AlertCircle,
      color: "red",
      count: workflowCounts.issues,
      urgent: workflowCounts.issues > 0,
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

        <WorkflowSummary
          role="Customer"
          counts={{
            pending: workflowCounts.pendingRequests,
            inProgress: workflowCounts.pendingJobCards,
            onHold: workflowCounts.onHold,
            completed: workflowCounts.completedWeek,
            urgent: workflowCounts.maintenanceDue,
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customerTiles.map((tile, index) => (
            <DashboardTile
              key={index}
              title={tile.title}
              description={tile.description}
              icon={tile.icon}
              color={tile.color}
              count={tile.count}
              urgent={tile.urgent}
              onClick={tile.onClick}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
