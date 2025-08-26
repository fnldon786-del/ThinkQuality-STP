"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import Link from "next/link"

interface IncompleteJob {
  id: string
  job_number: string
  title: string
  status: string
  priority: string
  due_date: string
  equipment_name: string
  reason: string
}

interface IncompleteJobsListProps {
  role: string
  userId: string
  limit?: number
}

export function IncompleteJobsList({ role, userId, limit = 5 }: IncompleteJobsListProps) {
  const [incompleteJobs, setIncompleteJobs] = useState<IncompleteJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadIncompleteJobs()
  }, [role, userId])

  const loadIncompleteJobs = async () => {
    setIsLoading(true)

    try {
      const today = new Date()
      let query = supabase
        .from("job_cards")
        .select("id, job_number, title, status, priority, due_date, equipment_name, notes")
        .in("status", ["Draft", "Assigned", "In Progress"])
        .order("due_date", { ascending: true })
        .limit(limit)

      // Apply role-based filtering
      if (role === "Technician") {
        query = query.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
      } else if (role === "Customer") {
        query = query.eq("customer_id", userId)
      }

      const { data, error } = await query

      if (error) {
        console.error("Error loading incomplete jobs:", error)
      } else if (data) {
        const processedJobs = data
          .map((job) => ({
            ...job,
            reason: getIncompleteReason(job, today),
          }))
          .filter((job) => job.reason !== "")

        setIncompleteJobs(processedJobs)
      }
    } catch (error) {
      console.error("Error loading incomplete jobs:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getIncompleteReason = (job: any, today: Date) => {
    if (job.due_date && new Date(job.due_date) < today) {
      return "Overdue"
    }
    if (job.notes?.toLowerCase().includes("waiting") && job.notes?.toLowerCase().includes("parts")) {
      return "Waiting on Parts"
    }
    if (job.notes?.toLowerCase().includes("hold")) {
      return "On Hold"
    }
    if (job.notes?.toLowerCase().includes("time") || job.notes?.toLowerCase().includes("end of day")) {
      return "Ran Out of Time"
    }
    if (job.notes?.toLowerCase().includes("temp") && job.notes?.toLowerCase().includes("fix")) {
      return "Temporary Fix"
    }
    if (job.status === "Draft") {
      return "Pending Approval"
    }
    if (job.status === "Assigned") {
      return "Not Started"
    }
    return ""
  }

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case "Overdue":
        return "bg-red-100 text-red-800"
      case "Waiting on Parts":
        return "bg-yellow-100 text-yellow-800"
      case "On Hold":
        return "bg-orange-100 text-orange-800"
      case "Ran Out of Time":
        return "bg-blue-100 text-blue-800"
      case "Temporary Fix":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Incomplete Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Incomplete Jobs ({incompleteJobs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {incompleteJobs.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No incomplete jobs found</p>
        ) : (
          <div className="space-y-3">
            {incompleteJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{job.title}</h4>
                    <Badge className={getReasonColor(job.reason)}>{job.reason}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{job.job_number}</p>
                  {job.equipment_name && <p className="text-xs text-muted-foreground">{job.equipment_name}</p>}
                  {job.due_date && (
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Due {format(new Date(job.due_date), "MMM d")}
                      </span>
                    </div>
                  )}
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/${role.toLowerCase()}/job-cards/${job.id}`}>View</Link>
                </Button>
              </div>
            ))}
            {incompleteJobs.length === limit && (
              <Button asChild variant="ghost" className="w-full">
                <Link href={`/${role.toLowerCase()}/job-cards?filter=incomplete`}>View All Incomplete Jobs</Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
