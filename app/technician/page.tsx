"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardTile } from "@/components/dashboard-tile"
import { WorkflowSummary } from "@/components/workflow-summary"
import { FileText, ClipboardCheck, Wrench, Search, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export default function TechnicianDashboard() {
  const router = useRouter()
  const [workflowCounts, setWorkflowCounts] = useState({
    assigned: 0,
    onHold: 0,
    maintenanceDue: 0,
    completed: 0,
    checkSheetsPending: 0,
  })

  useEffect(() => {
    const fetchWorkflowCounts = async () => {
      const supabase = createClient()

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        const [
          { count: assignedJobs },
          { count: onHoldJobs },
          { count: maintenanceDue },
          { count: completedJobs },
          { count: pendingCheckSheets },
        ] = await Promise.all([
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .eq("assigned_to", user.id)
            .in("status", ["pending", "in_progress"]),
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .eq("assigned_to", user.id)
            .in("status", ["on_hold", "incomplete"]),
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .eq("assigned_to", user.id)
            .eq("type", "maintenance")
            .lte("due_date", new Date().toISOString()),
          supabase
            .from("job_cards")
            .select("*", { count: "exact", head: true })
            .eq("assigned_to", user.id)
            .eq("status", "completed")
            .gte("completed_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
          supabase
            .from("check_sheet_completions")
            .select("*", { count: "exact", head: true })
            .eq("technician_id", user.id)
            .eq("status", "pending"),
        ])

        setWorkflowCounts({
          assigned: assignedJobs || 0,
          onHold: onHoldJobs || 0,
          maintenanceDue: maintenanceDue || 0,
          completed: completedJobs || 0,
          checkSheetsPending: pendingCheckSheets || 0,
        })
      } catch (error) {
        console.error("Error fetching workflow counts:", error)
      }
    }

    fetchWorkflowCounts()
  }, [])

  const technicianTiles = [
    {
      title: "My Job Cards",
      description: "View and manage your assigned job cards",
      icon: FileText,
      color: "primary",
      count: workflowCounts.assigned,
      urgent: workflowCounts.onHold > 0,
      onClick: () => router.push("/technician/job-cards"),
    },
    {
      title: "Create Job Card",
      description: "Create a new job card for maintenance work",
      icon: Plus,
      color: "green",
      onClick: () => router.push("/technician/job-cards/create"),
    },
    {
      title: "SOPs Library",
      description: "Access Standard Operating Procedures",
      icon: ClipboardCheck,
      color: "blue",
      onClick: () => router.push("/technician/sops"),
    },
    {
      title: "Check Sheets",
      description: "Complete inspection and quality check sheets",
      icon: ClipboardCheck,
      color: "orange",
      count: workflowCounts.checkSheetsPending,
      onClick: () => router.push("/technician/check-sheets"),
    },
    {
      title: "Fault Database",
      description: "Search and report equipment faults",
      icon: Wrench,
      color: "red",
      onClick: () => router.push("/technician/faults"),
    },
    {
      title: "Search Knowledge Base",
      description: "Search for solutions and procedures",
      icon: Search,
      color: "purple",
      onClick: () => router.push("/technician/search"),
    },
  ]

  return (
    <DashboardLayout role="Technician">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Technician Dashboard</h2>
          <p className="text-muted-foreground mt-2">Access your work assignments and technical resources</p>
        </div>

        <WorkflowSummary
          role="Technician"
          counts={{
            pending: workflowCounts.assigned,
            inProgress: workflowCounts.assigned,
            onHold: workflowCounts.onHold,
            completed: workflowCounts.completed,
            urgent: workflowCounts.maintenanceDue,
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicianTiles.map((tile, index) => (
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
