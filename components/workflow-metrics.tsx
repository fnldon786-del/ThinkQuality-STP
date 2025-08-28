"use client"

import { createClient } from "@/lib/supabase/client"
import { MetricsCard } from "./metrics-card"
import { Clock, AlertTriangle, CheckCircle, FileText, Wrench } from "lucide-react"
import { useEffect, useState } from "react"

interface WorkflowMetrics {
  pendingRequests: number
  openJobCards: number
  jobsInProgress: number
  incompleteJobs: number
  completedToday: number
  assignedJobCards: number
  jobsOnHold: number
  maintenanceDue: number
  completedThisWeek: number
}

interface WorkflowMetricsProps {
  role: string
  userId: string
}

export function WorkflowMetrics({ role, userId }: WorkflowMetricsProps) {
  const [metrics, setMetrics] = useState<WorkflowMetrics>({
    pendingRequests: 0,
    openJobCards: 0,
    jobsInProgress: 0,
    incompleteJobs: 0,
    completedToday: 0,
    assignedJobCards: 0,
    jobsOnHold: 0,
    maintenanceDue: 0,
    completedThisWeek: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadMetrics()
  }, [role, userId])

  const loadMetrics = async () => {
    setIsLoading(true)

    try {
      const today = new Date()
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Base query for job cards
      let baseQuery = supabase.from("job_cards").select("*")

      // Apply role-based filtering
      if (role === "Technician") {
        baseQuery = baseQuery.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      } else if (role === "Customer") {
        baseQuery = baseQuery.eq("customer_id", userId)
      }

      const { data: allJobCards } = await baseQuery

      if (allJobCards) {
        const newMetrics: WorkflowMetrics = {
          pendingRequests: allJobCards.filter((job) => job.status === "Draft").length,
          openJobCards: allJobCards.filter((job) => ["Draft", "Assigned"].includes(job.status)).length,
          jobsInProgress: allJobCards.filter((job) => job.status === "In Progress").length,
          incompleteJobs: allJobCards.filter(
            (job) => ["Draft", "Assigned", "In Progress"].includes(job.status) && new Date(job.due_date) < today,
          ).length,
          completedToday: allJobCards.filter(
            (job) => job.status === "Completed" && new Date(job.completed_at) >= startOfDay,
          ).length,
          assignedJobCards: allJobCards.filter(
            (job) => job.assigned_to === userId && ["Assigned", "In Progress"].includes(job.status),
          ).length,
          jobsOnHold: allJobCards.filter(
            (job) => job.status === "In Progress" && job.notes?.toLowerCase().includes("hold"),
          ).length,
          maintenanceDue: allJobCards.filter(
            (job) =>
              job.due_date &&
              new Date(job.due_date) <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) &&
              !["Completed", "Cancelled"].includes(job.status),
          ).length,
          completedThisWeek: allJobCards.filter(
            (job) => job.status === "Completed" && new Date(job.completed_at) >= startOfWeek,
          ).length,
        }

        setMetrics(newMetrics)
      }
    } catch (error) {
      console.error("Error loading workflow metrics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg"></div>
        ))}
      </div>
    )
  }

  const getMetricsForRole = () => {
    switch (role) {
      case "Admin":
      case "SuperAdmin":
        return [
          {
            title: "Requests Waiting Approval",
            value: metrics.pendingRequests,
            icon: <Clock className="h-4 w-4" />,
            trend: metrics.pendingRequests > 5 ? "down" : ("neutral" as const),
          },
          {
            title: "Open Job Cards",
            value: metrics.openJobCards,
            icon: <FileText className="h-4 w-4" />,
            trend: "neutral" as const,
          },
          {
            title: "Jobs In Progress",
            value: metrics.jobsInProgress,
            icon: <Wrench className="h-4 w-4" />,
            trend: "neutral" as const,
          },
          {
            title: "Incomplete/On-Hold Jobs",
            value: metrics.incompleteJobs + metrics.jobsOnHold,
            icon: <AlertTriangle className="h-4 w-4" />,
            trend: metrics.incompleteJobs > 0 ? "down" : ("up" as const),
          },
          {
            title: "Jobs Completed Today",
            value: metrics.completedToday,
            icon: <CheckCircle className="h-4 w-4" />,
            trend: "up" as const,
          },
        ]

      case "Technician":
        return [
          {
            title: "Assigned Job Cards",
            value: metrics.assignedJobCards,
            icon: <FileText className="h-4 w-4" />,
            trend: "neutral" as const,
          },
          {
            title: "Jobs On Hold/Incomplete",
            value: metrics.jobsOnHold + metrics.incompleteJobs,
            icon: <AlertTriangle className="h-4 w-4" />,
            trend: metrics.jobsOnHold > 0 ? "down" : ("up" as const),
          },
          {
            title: "Maintenance Due",
            value: metrics.maintenanceDue,
            icon: <Clock className="h-4 w-4" />,
            trend: metrics.maintenanceDue > 0 ? "down" : ("neutral" as const),
          },
          {
            title: "Completed Today",
            value: metrics.completedToday,
            icon: <CheckCircle className="h-4 w-4" />,
            trend: "up" as const,
          },
        ]

      case "Customer":
        return [
          {
            title: "Pending Requests",
            value: metrics.pendingRequests,
            icon: <Clock className="h-4 w-4" />,
            trend: "neutral" as const,
          },
          {
            title: "Pending Job Cards",
            value: metrics.openJobCards,
            icon: <FileText className="h-4 w-4" />,
            trend: "neutral" as const,
          },
          {
            title: "Jobs On Hold/Incomplete",
            value: metrics.jobsOnHold + metrics.incompleteJobs,
            icon: <AlertTriangle className="h-4 w-4" />,
            trend: metrics.jobsOnHold > 0 ? "down" : ("up" as const),
          },
          {
            title: "Maintenance Due",
            value: metrics.maintenanceDue,
            icon: <Wrench className="h-4 w-4" />,
            trend: metrics.maintenanceDue > 0 ? "down" : ("neutral" as const),
          },
          {
            title: "Completed This Week",
            value: metrics.completedThisWeek,
            icon: <CheckCircle className="h-4 w-4" />,
            trend: "up" as const,
          },
        ]

      default:
        return []
    }
  }

  const roleMetrics = getMetricsForRole()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {roleMetrics.map((metric, index) => (
        <MetricsCard key={index} title={metric.title} value={metric.value} icon={metric.icon} trend={metric.trend} />
      ))}
    </div>
  )
}
