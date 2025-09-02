"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Square, Clock, Plus } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface TimeTrackerProps {
  jobCardId: string
  currentStatus: string
  estimatedHours?: number
  actualHours?: number
  startedAt?: string
  onTimeUpdate?: (actualHours: number) => void
}

interface TimeEntry {
  id: string
  start_time: string
  end_time?: string
  duration_minutes: number
  description: string
  created_at: string
}

export function TimeTracker({
  jobCardId,
  currentStatus,
  estimatedHours = 0,
  actualHours = 0,
  startedAt,
  onTimeUpdate,
}: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [manualHours, setManualHours] = useState("")
  const [manualDescription, setManualDescription] = useState("")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchTimeEntries()

    // Check if there's an active session
    if (startedAt && currentStatus === "In Progress") {
      const startTime = new Date(startedAt)
      const now = new Date()
      if (now.getTime() - startTime.getTime() < 24 * 60 * 60 * 1000) {
        // Within 24 hours
        setCurrentSessionStart(startTime)
        setIsRunning(true)
      }
    }
  }, [jobCardId])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && currentSessionStart) {
      interval = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - currentSessionStart.getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, currentSessionStart])

  const fetchTimeEntries = async () => {
    try {
      const { data, error } = await supabase
        .from("job_card_time_entries")
        .select("*")
        .eq("job_card_id", jobCardId)
        .order("created_at", { ascending: false })

      if (error) throw error
      setTimeEntries(data || [])
    } catch (error) {
      console.error("Error fetching time entries:", error)
    }
  }

  const startTimer = async () => {
    try {
      const now = new Date()
      setCurrentSessionStart(now)
      setIsRunning(true)
      setElapsedTime(0)

      // Update job card status and started_at
      const { error } = await supabase
        .from("job_cards")
        .update({
          status: "In Progress",
          started_at: now.toISOString(),
        })
        .eq("id", jobCardId)

      if (error) throw error
    } catch (error) {
      console.error("Error starting timer:", error)
    }
  }

  const pauseTimer = async () => {
    if (!currentSessionStart) return

    try {
      const now = new Date()
      const durationMinutes = Math.floor((now.getTime() - currentSessionStart.getTime()) / (1000 * 60))

      // Save time entry
      const { error } = await supabase.from("job_card_time_entries").insert({
        job_card_id: jobCardId,
        start_time: currentSessionStart.toISOString(),
        end_time: now.toISOString(),
        duration_minutes: durationMinutes,
        description: "Work session",
      })

      if (error) throw error

      // Update total actual hours
      const newActualHours = actualHours + durationMinutes / 60
      await updateActualHours(newActualHours)

      setIsRunning(false)
      setCurrentSessionStart(null)
      setElapsedTime(0)
      await fetchTimeEntries()
    } catch (error) {
      console.error("Error pausing timer:", error)
    }
  }

  const stopTimer = async () => {
    await pauseTimer()

    // Optionally update status back to Assigned
    try {
      const { error } = await supabase.from("job_cards").update({ status: "Assigned" }).eq("id", jobCardId)

      if (error) throw error
    } catch (error) {
      console.error("Error stopping timer:", error)
    }
  }

  const addManualTime = async () => {
    if (!manualHours || !manualDescription) return

    try {
      const hours = Number.parseFloat(manualHours)
      const durationMinutes = Math.floor(hours * 60)

      const { error } = await supabase.from("job_card_time_entries").insert({
        job_card_id: jobCardId,
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
        duration_minutes: durationMinutes,
        description: manualDescription,
      })

      if (error) throw error

      const newActualHours = actualHours + hours
      await updateActualHours(newActualHours)

      setManualHours("")
      setManualDescription("")
      await fetchTimeEntries()
    } catch (error) {
      console.error("Error adding manual time:", error)
    }
  }

  const updateActualHours = async (newHours: number) => {
    try {
      const { error } = await supabase.from("job_cards").update({ actual_hours: newHours }).eq("id", jobCardId)

      if (error) throw error
      onTimeUpdate?.(newHours)
    } catch (error) {
      console.error("Error updating actual hours:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Time Tracking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Timer Display */}
          <div className="text-center">
            <div className="text-3xl font-mono font-bold">{formatTime(elapsedTime)}</div>
            <div className="text-sm text-muted-foreground">{isRunning ? "Timer running" : "Timer stopped"}</div>
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center gap-2">
            {!isRunning ? (
              <Button onClick={startTimer} className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                Start
              </Button>
            ) : (
              <>
                <Button onClick={pauseTimer} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
                <Button onClick={stopTimer} variant="outline" className="flex items-center gap-2 bg-transparent">
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Time Summary */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{estimatedHours}h</div>
              <div className="text-sm text-muted-foreground">Estimated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{actualHours.toFixed(1)}h</div>
              <div className="text-sm text-muted-foreground">Actual</div>
            </div>
          </div>

          {/* Progress Bar */}
          {estimatedHours > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round((actualHours / estimatedHours) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((actualHours / estimatedHours) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Time Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Manual Time
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manual-hours">Hours</Label>
              <Input
                id="manual-hours"
                type="number"
                step="0.25"
                value={manualHours}
                onChange={(e) => setManualHours(e.target.value)}
                placeholder="1.5"
              />
            </div>
            <div>
              <Label htmlFor="manual-description">Description</Label>
              <Input
                id="manual-description"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="Work description"
              />
            </div>
          </div>
          <Button onClick={addManualTime} disabled={!manualHours || !manualDescription}>
            Add Time Entry
          </Button>
        </CardContent>
      </Card>

      {/* Time Entries History */}
      {timeEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <div className="font-medium">{entry.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(entry.start_time).toLocaleDateString()} at{" "}
                      {new Date(entry.start_time).toLocaleTimeString()}
                    </div>
                  </div>
                  <Badge variant="outline">{formatDuration(entry.duration_minutes)}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
