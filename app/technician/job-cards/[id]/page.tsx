"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { TimeTracker } from "@/components/time-tracker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface JobCard {
  id: string
  job_number: string
  title: string
  description: string
  status: string
  priority: string
  equipment_name: string
  location: string
  estimated_hours: number
  actual_hours: number
  started_at: string
  completed_at: string
  due_date: string
  created_at: string
}

export default function JobCardDetailPage({ params }: { params: { id: string } }) {
  const [jobCard, setJobCard] = useState<JobCard | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchJobCard()
  }, [params.id])

  const fetchJobCard = async () => {
    try {
      const { data, error } = await supabase.from("job_cards").select("*").eq("id", params.id).single()

      if (error) throw error
      setJobCard(data)
    } catch (error) {
      console.error("Error fetching job card:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (status: string, timestamp?: string) => {
    if (jobCard) {
      setJobCard({
        ...jobCard,
        status,
        ...(status === "In Progress" && timestamp ? { started_at: timestamp } : {}),
        ...(status === "Completed" && timestamp ? { completed_at: timestamp } : {}),
      })
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Technician">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!jobCard) {
    return (
      <DashboardLayout role="Technician">
        <div className="text-center p-8">
          <p className="text-muted-foreground">Job card not found</p>
          <Button asChild className="mt-4">
            <Link href="/technician/job-cards">Back to Job Cards</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Medium":
        return "bg-blue-100 text-blue-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout role="Technician">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">{jobCard.title}</h2>
            <p className="text-muted-foreground">Job #{jobCard.job_number}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Job Details
                  </span>
                  <Badge className={getPriorityColor(jobCard.priority)}>{jobCard.priority}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">Description</h4>
                  <p className="text-muted-foreground">{jobCard.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Equipment</h4>
                    <p className="text-muted-foreground">{jobCard.equipment_name || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Location</h4>
                    <p className="text-muted-foreground">{jobCard.location || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Estimated Hours</h4>
                    <p className="text-muted-foreground">{jobCard.estimated_hours || "N/A"}</p>
                  </div>
                  <div>
                    <h4 className="font-medium">Due Date</h4>
                    <p className="text-muted-foreground">
                      {jobCard.due_date ? new Date(jobCard.due_date).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <TimeTracker
              jobCardId={jobCard.id}
              currentStatus={jobCard.status}
              startedAt={jobCard.started_at}
              completedAt={jobCard.completed_at}
              onStatusChange={handleStatusChange}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
