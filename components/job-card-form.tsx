"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, X } from "lucide-react"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

interface Profile {
  id: string
  full_name: string
  role: string
}

interface JobCardFormData {
  title: string
  description: string
  priority: string
  equipment_name: string
  location: string
  estimated_hours: string
  assigned_to: string
  customer_id: string
  due_date: Date | undefined
  tasks: string[]
}

interface JobCardFormProps {
  onSuccess?: () => void
  initialData?: Partial<JobCardFormData>
}

export function JobCardForm({ onSuccess, initialData }: JobCardFormProps) {
  const [formData, setFormData] = useState<JobCardFormData>({
    title: "",
    description: "",
    priority: "Medium",
    equipment_name: "",
    location: "",
    estimated_hours: "",
    assigned_to: "",
    customer_id: "",
    due_date: undefined,
    tasks: [""],
    ...initialData,
  })
  const [technicians, setTechnicians] = useState<Profile[]>([])
  const [customers, setCustomers] = useState<Profile[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Load technicians and customers
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, role")

      if (profiles) {
        setTechnicians(profiles.filter((p) => p.role === "Technician"))
        setCustomers(profiles.filter((p) => p.role === "Customer"))
      }
    }

    loadData()
  }, [supabase])

  const handleInputChange = (field: keyof JobCardFormData, value: string | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTask = () => {
    setFormData((prev) => ({ ...prev, tasks: [...prev.tasks, ""] }))
  }

  const removeTask = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }))
  }

  const updateTask = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => (i === index ? value : task)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setIsLoading(true)
    setError(null)

    try {
      // Create job card
      const { data: jobCard, error: jobCardError } = await supabase
        .from("job_cards")
        .insert({
          job_number: `JC${Date.now()}`, // Temporary - will be replaced by trigger
          title: formData.title,
          description: formData.description,
          priority: formData.priority,
          equipment_name: formData.equipment_name,
          location: formData.location,
          estimated_hours: formData.estimated_hours ? Number.parseFloat(formData.estimated_hours) : null,
          assigned_to: formData.assigned_to || null,
          customer_id: formData.customer_id || null,
          due_date: formData.due_date?.toISOString(),
          created_by: currentUser.id,
        })
        .select()
        .single()

      if (jobCardError) throw jobCardError

      // Create tasks
      if (jobCard && formData.tasks.filter((task) => task.trim()).length > 0) {
        const tasksToInsert = formData.tasks
          .filter((task) => task.trim())
          .map((task) => ({
            job_card_id: jobCard.id,
            task_description: task.trim(),
          }))

        const { error: tasksError } = await supabase.from("job_card_tasks").insert(tasksToInsert)

        if (tasksError) throw tasksError
      }

      onSuccess?.()
      router.push("/technician/job-cards")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Job Card</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter job title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe the work to be performed"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="equipment_name">Equipment</Label>
              <Input
                id="equipment_name"
                value={formData.equipment_name}
                onChange={(e) => handleInputChange("equipment_name", e.target.value)}
                placeholder="Equipment name/ID"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Work location"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="estimated_hours">Estimated Hours</Label>
              <Input
                id="estimated_hours"
                type="number"
                step="0.5"
                value={formData.estimated_hours}
                onChange={(e) => handleInputChange("estimated_hours", e.target.value)}
                placeholder="0.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to">Assign to Technician</Label>
              <Select value={formData.assigned_to} onValueChange={(value) => handleInputChange("assigned_to", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      {tech.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer_id">Customer</Label>
              <Select value={formData.customer_id} onValueChange={(value) => handleInputChange("customer_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? format(formData.due_date, "PPP") : "Select due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) => handleInputChange("due_date", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Tasks</Label>
              <Button type="button" variant="outline" size="sm" onClick={addTask}>
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </div>
            {formData.tasks.map((task, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={task}
                  onChange={(e) => updateTask(index, e.target.value)}
                  placeholder={`Task ${index + 1}`}
                />
                {formData.tasks.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removeTask(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Job Card"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
