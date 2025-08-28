"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardTile } from "@/components/dashboard-tile"
import { WorkflowSummary } from "@/components/workflow-summary"
import { Users, FileText, ClipboardCheck, Wrench, BarChart3, Settings, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function AdminDashboard() {
  const router = useRouter()
  const [workflowCounts, setWorkflowCounts] = useState({
    pending: 0,
    inProgress: 0,
    onHold: 0,
    completed: 0,
    users: 0,
    companies: 0,
  })

  useEffect(() => {
    const fetchWorkflowCounts = async () => {
      const supabase = createClient()

      try {
        const [
          { count: pendingRequests },
          { count: inProgressJobs },
          { count: onHoldJobs },
          { count: completedToday },
          { count: totalUsers },
          { count: totalCompanies },
        ] = await Promise.all([
          supabase.from("job_cards").select("*", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("job_cards").select("*", { count: "exact", head: true }).eq("status", "in_progress"),
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .in("status", ["on_hold", "incomplete"]),
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .eq("status", "completed")
            .gte("completed_at", new Date().toISOString().split("T")[0]),
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("companies").select("*", { count: "exact", head: true }),
        ])

        setWorkflowCounts({
          pending: pendingRequests || 0,
          inProgress: inProgressJobs || 0,
          onHold: onHoldJobs || 0,
          completed: completedToday || 0,
          users: totalUsers || 0,
          companies: totalCompanies || 0,
        })
      } catch (error) {
        console.error("Error fetching workflow counts:", error)
      }
    }

    fetchWorkflowCounts()
  }, [])

  const adminTiles = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      color: "blue",
      count: workflowCounts.users,
      onClick: () => router.push("/admin/users"),
    },
    {
      title: "Company Management",
      description: "Manage companies and organizational structure",
      icon: Building2,
      color: "green",
      count: workflowCounts.companies,
      onClick: () => router.push("/admin/companies"),
    },
    {
      title: "Job Cards",
      description: "View and manage all job cards across the system",
      icon: FileText,
      color: "primary",
      count: workflowCounts.pending + workflowCounts.inProgress,
      onClick: () => router.push("/admin/job-cards"),
    },
    {
      title: "SOPs Management",
      description: "Create and manage Standard Operating Procedures",
      icon: ClipboardCheck,
      color: "orange",
      onClick: () => router.push("/admin/sops"),
    },
    {
      title: "Check Sheets",
      description: "Manage inspection and quality check sheets",
      icon: ClipboardCheck,
      color: "purple",
      onClick: () => router.push("/admin/check-sheets"),
    },
    {
      title: "Fault & Fix Database",
      description: "Manage fault reports and resolution database",
      icon: Wrench,
      color: "red",
      onClick: () => router.push("/admin/faults"),
    },
    {
      title: "Reports & Analytics",
      description: "View comprehensive system reports and analytics",
      icon: BarChart3,
      color: "blue",
      onClick: () => router.push("/admin/reports"),
    },
    {
      title: "System Settings",
      description: "Configure system settings and preferences",
      icon: Settings,
      color: "primary",
      onClick: () => router.push("/admin/settings"),
    },
  ]

  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-2">Manage your ThinkQuality system and oversee all operations</p>
        </div>

        <WorkflowSummary
          role="Admin"
          counts={{
            pending: workflowCounts.pending,
            inProgress: workflowCounts.inProgress,
            onHold: workflowCounts.onHold,
            completed: workflowCounts.completed,
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminTiles.map((tile, index) => (
            <DashboardTile
              key={index}
              title={tile.title}
              description={tile.description}
              icon={tile.icon}
              color={tile.color}
              count={tile.count}
              urgent={tile.title === "Job Cards" && workflowCounts.onHold > 0}
              onClick={tile.onClick}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}
