"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileUpload } from "@/components/file-upload"
import { TimeTracker } from "@/components/time-tracker"
import { SignOffWorkflow } from "@/components/sign-off-workflow"
import { ArrowLeft, Calendar, MapPin, User, Wrench, CheckCircle } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface JobCard {
  id: string
  job_number: string
  title: string
  description: string
  priority: string
  status: string
  equipment_name: string
  location: string
  estimated_hours: number
  actual_hours: number
  due_date: string
  started_at: string
  completed_at: string
  notes: string
  work_performed: string
  created_at: string
  assigned_technician?: {
    full_name: string
  }
  customer?: {
    full_name: string
  }
}

interface JobCardTask {
  id: string
  task_description: string
  is_completed: boolean
  completed_at: string
  notes: string
}

export default function JobCardDetailPage({ params }: { params: { id: string } }) {
  const [jobCard, setJobCard] = useState<JobCard | null>(null)
  const [tasks, setTasks] = useState<JobCardTask[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [workPerformed, setWorkPerformed] = useState("")
  const [notes, setNotes] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchJobCard()
    fetchTasks()
    fetchCurrentUser()
  }, [params.id])

  const fetchJobCard = async () => {
    try {
      const { data, error } = await supabase
        .from("job_cards")
        .select(`
          *,
          assigned_technician:assigned_to(full_name),
          customer:customer_id(full_name)
        `)
        .eq("id", params.id)
        .single()

      if (error) throw error

      setJobCard(data)
      setWorkPerformed(data.work_performed || "")
      setNotes(data.notes || "")
    } catch (error) {
      console.error("Error fetching job card:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("job_card_tasks")
        .select("*")
        .eq("job_card_id", params.id)
        .order("created_at", { ascending: true })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error("Error fetching tasks:", error)
    }
  }

  const fetchCurrentUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        setCurrentUser({ ...user, profile })
      }
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  const updateJobCard = async (updates: Partial<JobCard>) => {
    setUpdating(true)
    try {
      const { error } = await supabase.from("job_cards").update(updates).eq("id", params.id)

      if (error) throw error
      await fetchJobCard()
    } catch (error) {
      console.error("Error updating job card:", error)
    } finally {
      setUpdating(false)
    }
  }

  const toggleTask = async (taskId: string, completed: boolean) => {
    try {
      const updates: any = {
        is_completed: completed,
      }

      if (completed) {
        updates.completed_at = new Date().toISOString()
        updates.completed_by = (await supabase.auth.getUser()).data.user?.id
      } else {
        updates.completed_at = null
        updates.completed_by = null
      }

      const { error } = await supabase.from("job_card_tasks").update(updates).eq("id", taskId)

      if (error) throw error
      await fetchTasks()
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const completeJobCard = async () => {
    await updateJobCard({
      status: "Completed",
      completed_at: new Date().toISOString(),
      work_performed: workPerformed,
      notes: notes,
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800"
      case "High":
        return "bg-orange-100 text-orange-800"
      case "Medium":
        return "bg-yellow-100 text-yellow-800"
      case "Low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Assigned":
        return "bg-purple-100 text-purple-800"
      case "Draft":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Technician">
        <div className="flex items-center justify-center h-64">Loading job card...</div>
      </DashboardLayout>
    )
  }

  if (!jobCard) {
    return (
      <DashboardLayout role="Technician">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Job Card Not Found</h3>
          <Button asChild>
            <Link href="/technician/job-cards">Back to Job Cards</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
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
            <p className="text-muted-foreground">{jobCard.job_number}</p>
          </div>
          <div className="ml-auto flex gap-2">
            <Badge className={getPriorityColor(jobCard.priority)}>{jobCard.priority}</Badge>
            <Badge className={getStatusColor(jobCard.status)}>{jobCard.status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Job Details */}
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>{jobCard.description}</p>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  {jobCard.equipment_name && (
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span>{jobCard.equipment_name}</span>
                    </div>
                  )}
                  {jobCard.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{jobCard.location}</span>
                    </div>
                  )}
                  {jobCard.assigned_technician && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{jobCard.assigned_technician.full_name}</span>
                    </div>
                  )}
                  {jobCard.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Due {new Date(jobCard.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tasks */}
            {tasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 border rounded">
                        <input
                          type="checkbox"
                          checked={task.is_completed}
                          onChange={(e) => toggleTask(task.id, e.target.checked)}
                          className="h-4 w-4"
                        />
                        <span className={task.is_completed ? "line-through text-muted-foreground" : ""}>
                          {task.task_description}
                        </span>
                        {task.is_completed && (
                          <Badge variant="outline" className="ml-auto">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Work Performed */}
            <Card>
              <CardHeader>
                <CardTitle>Work Performed</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="work-performed">Description of work completed</Label>
                  <Textarea
                    id="work-performed"
                    value={workPerformed}
                    onChange={(e) => setWorkPerformed(e.target.value)}
                    placeholder="Describe the work that was performed..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes or observations..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => updateJobCard({ work_performed: workPerformed, notes: notes })}
                    disabled={updating}
                  >
                    Save Progress
                  </Button>
                  {jobCard.status !== "Completed" && (
                    <Button onClick={completeJobCard} disabled={updating}>
                      Complete Job
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* File Attachments */}
            <Card>
              <CardHeader>
                <CardTitle>Attachments</CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload jobCardId={jobCard.id} />
              </CardContent>
            </Card>

            {/* Sign-off Workflow */}
            {currentUser && (
              <SignOffWorkflow
                referenceId={jobCard.id}
                referenceType="job_card"
                currentUserRole={currentUser.profile?.role || "Technician"}
                currentUserId={currentUser.id}
                currentUserName={currentUser.profile?.full_name || ""}
                onWorkflowUpdate={fetchJobCard}
              />
            )}
          </div>

          <div className="space-y-6">
            {/* Time Tracking */}
            <TimeTracker
              jobCardId={jobCard.id}
              currentStatus={jobCard.status}
              estimatedHours={jobCard.estimated_hours}
              actualHours={jobCard.actual_hours}
              startedAt={jobCard.started_at}
              onTimeUpdate={(hours) => setJobCard({ ...jobCard, actual_hours: hours })}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
