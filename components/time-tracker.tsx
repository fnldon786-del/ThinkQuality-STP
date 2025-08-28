"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Play, Pause, Clock, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TimeTrackerProps {
  jobCardId: string
  currentStatus?: string
  startedAt?: string
  completedAt?: string
  onStatusChange?: (status: string, timestamp?: string) => void
}

interface TimeEntry {
  id: string
  started_at: string
  ended_at?: string
  duration_minutes?: number
  notes?: string
  status: string
}

export function TimeTracker({
  jobCardId,
  currentStatus = "Draft",
  startedAt,
  completedAt,
  onStatusChange,
}: TimeTrackerProps) {
  const [status, setStatus] = useState(currentStatus)
  const [isRunning, setIsRunning] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [holdReason, setHoldReason] = useState("")
  const [completionNotes, setCompletionNotes] = useState("")
  const [showHoldDialog, setShowHoldDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    if (startedAt && !completedAt && status === "In Progress") {
      setIsRunning(true)
      const startTime = new Date(startedAt).getTime()
      const updateTimer = () => {
        setCurrentTime(Math.floor((Date.now() - startTime) / 1000))
      }
      updateTimer()
      const interval = setInterval(updateTimer, 1000)
      return () => clearInterval(interval)
    }
  }, [startedAt, completedAt, status])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const startJob = async () => {
    try {
      const now = new Date().toISOString()

      const { error } = await supabase
        .from("job_cards")
        .update({
          status: "In Progress",
          started_at: now,
        })
        .eq("id", jobCardId)

      if (error) throw error

      setStatus("In Progress")
      setIsRunning(true)
      onStatusChange?.("In Progress", now)

      toast({
        title: "Job Started",
        description: "Time tracking has begun",
      })
    } catch (error) {
      console.error("Error starting job:", error)
      toast({
        title: "Error",
        description: "Failed to start job",
        variant: "destructive",
      })
    }
  }

  const pauseJob = () => {
    setShowHoldDialog(true)
  }

  const holdJob = async () => {
    try {
      const { error } = await supabase
        .from("job_cards")
        .update({
          status: "On Hold",
          notes: holdReason,
        })
        .eq("id", jobCardId)

      if (error) throw error

      setStatus("On Hold")
      setIsRunning(false)
      setShowHoldDialog(false)
      setHoldReason("")
      onStatusChange?.("On Hold")

      toast({
        title: "Job On Hold",
        description: "Time tracking paused",
      })
    } catch (error) {
      console.error("Error holding job:", error)
      toast({
        title: "Error",
        description: "Failed to put job on hold",
        variant: "destructive",
      })
    }
  }

  const resumeJob = async () => {
    try {
      const { error } = await supabase
        .from("job_cards")
        .update({
          status: "In Progress",
        })
        .eq("id", jobCardId)

      if (error) throw error

      setStatus("In Progress")
      setIsRunning(true)
      onStatusChange?.("In Progress")

      toast({
        title: "Job Resumed",
        description: "Time tracking resumed",
      })
    } catch (error) {
      console.error("Error resuming job:", error)
      toast({
        title: "Error",
        description: "Failed to resume job",
        variant: "destructive",
      })
    }
  }

  const completeJob = () => {
    setShowCompleteDialog(true)
  }

  const finishJob = async () => {
    try {
      const now = new Date().toISOString()

      // Calculate actual hours
      const startTime = startedAt ? new Date(startedAt).getTime() : Date.now()
      const actualHours = (Date.now() - startTime) / (1000 * 60 * 60)

      const { error } = await supabase
        .from("job_cards")
        .update({
          status: "Completed",
          completed_at: now,
          actual_hours: actualHours,
          notes: completionNotes,
        })
        .eq("id", jobCardId)

      if (error) throw error

      setStatus("Completed")
      setIsRunning(false)
      setShowCompleteDialog(false)
      setCompletionNotes("")
      onStatusChange?.("Completed", now)

      toast({
        title: "Job Completed",
        description: "Work has been marked as complete",
      })
    } catch (error) {
      console.error("Error completing job:", error)
      toast({
        title: "Error",
        description: "Failed to complete job",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "On Hold":
        return "bg-yellow-100 text-yellow-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking
          </span>
          <Badge className={getStatusColor(status)}>{status}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="text-center">
          <div className="text-3xl font-mono font-bold">{formatTime(currentTime)}</div>
          <p className="text-sm text-muted-foreground">{isRunning ? "Time running" : "Time stopped"}</p>
        </div>

        {/* Control Buttons */}
        <div className="flex justify-center gap-2">
          {status === "Draft" && (
            <Button onClick={startJob} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Job
            </Button>
          )}

          {status === "In Progress" && (
            <>
              <Button onClick={pauseJob} variant="outline" className="flex items-center gap-2 bg-transparent">
                <Pause className="h-4 w-4" />
                Hold
              </Button>
              <Button onClick={completeJob} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Complete
              </Button>
            </>
          )}

          {status === "On Hold" && (
            <Button onClick={resumeJob} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}

          {status === "Completed" && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              Job Completed
            </div>
          )}
        </div>

        {/* Hold Dialog */}
        {showHoldDialog && (
          <div className="space-y-4 p-4 border rounded-lg bg-yellow-50">
            <Label htmlFor="holdReason">Reason for hold</Label>
            <Select value={holdReason} onValueChange={setHoldReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="waiting_parts">Waiting for parts</SelectItem>
                <SelectItem value="waiting_approval">Waiting for approval</SelectItem>
                <SelectItem value="equipment_unavailable">Equipment unavailable</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button onClick={holdJob} size="sm">
                Confirm Hold
              </Button>
              <Button onClick={() => setShowHoldDialog(false)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Complete Dialog */}
        {showCompleteDialog && (
          <div className="space-y-4 p-4 border rounded-lg bg-green-50">
            <Label htmlFor="completionNotes">Completion notes</Label>
            <Textarea
              id="completionNotes"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
              placeholder="Add any notes about the completed work..."
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={finishJob} size="sm">
                Mark Complete
              </Button>
              <Button onClick={() => setShowCompleteDialog(false)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
