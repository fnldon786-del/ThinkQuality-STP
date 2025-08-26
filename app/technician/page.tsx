"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardTile } from "@/components/dashboard-tile"
import { WorkflowMetrics } from "@/components/workflow-metrics"
import { IncompleteJobsList } from "@/components/incomplete-jobs-list"
import { createClient } from "@/lib/supabase/client"
import { FileText, ClipboardCheck, Wrench, Search, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function TechnicianDashboard() {
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

  const technicianTiles = [
    {
      title: "My Job Cards",
      description: "View and manage your assigned job cards",
      icon: FileText,
      color: "primary",
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

        {userId && <WorkflowMetrics role="Technician" userId={userId} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {technicianTiles.map((tile, index) => (
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
            {userId && <IncompleteJobsList role="Technician" userId={userId} limit={6} />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
