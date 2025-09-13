"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardTile } from "@/components/dashboard-tile"
import { WorkflowMetrics } from "@/components/workflow-metrics"
import { IncompleteJobsList } from "@/components/incomplete-jobs-list"
import { createClient } from "@/lib/supabase/client"
import { Users, FileText, ClipboardCheck, Wrench, BarChart3, Building2, Cpu } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function AdminDashboard() {
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

  const adminTiles = [
    {
      title: "User Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      color: "blue",
      onClick: () => router.push("/admin/users"),
    },
    {
      title: "Company Management",
      description: "Manage companies and organizational structure",
      icon: Building2,
      color: "green",
      onClick: () => router.push("/admin/companies"),
    },
    {
      title: "Machine Management",
      description: "Manage customer machines and QR codes",
      icon: Cpu,
      color: "purple",
      onClick: () => router.push("/admin/machines"),
    },
    {
      title: "Job Cards",
      description: "View and manage all job cards across the system",
      icon: FileText,
      color: "primary",
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
  ]

  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Admin Dashboard</h2>
          <p className="text-muted-foreground mt-2">Manage your ThinkQuality system and oversee all operations</p>
        </div>

        {userId && <WorkflowMetrics role="Admin" userId={userId} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminTiles.map((tile, index) => (
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

          <div className="lg:col-span-1">{userId && <IncompleteJobsList role="Admin" userId={userId} limit={8} />}</div>
        </div>
      </div>
    </DashboardLayout>
  )
}
