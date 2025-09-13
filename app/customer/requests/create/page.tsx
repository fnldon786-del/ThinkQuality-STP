"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function CreateRequestPage() {
  const [loading, setLoading] = useState(false)
  const [machines, setMachines] = useState<any[]>([])
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    request_type: "Maintenance",
    machine_id: "No specific machine",
  })

  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    loadMachines()
  }, [])

  const loadMachines = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .eq("customer_id", user.id)
        .eq("status", "Active")

      if (error) {
        console.log("[v0] Machines table not found or no access, using empty list")
        setMachines([])
      } else {
        setMachines(data || [])
      }
    } catch (error) {
      console.error("Error loading machines:", error)
      setMachines([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const requestNumber = `REQ-${Date.now()}`

      const { error } = await supabase.from("customer_requests").insert({
        request_number: requestNumber,
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        request_type: formData.request_type,
        machine_id: formData.machine_id === "No specific machine" ? null : formData.machine_id,
        requested_by: user.id,
        status: "Submitted",
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Service request submitted successfully",
      })

      router.push("/customer/requests")
    } catch (error) {
      console.error("Error creating request:", error)
      toast({
        title: "Error",
        description: "Failed to submit request",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="Customer">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Submit Service Request</h2>
          <p className="text-muted-foreground mt-2">Submit a new service or maintenance request</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>Provide details about your service request</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="request_type">Request Type</Label>
                <Select
                  value={formData.request_type}
                  onValueChange={(value) => setFormData({ ...formData, request_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select request type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Repair">Repair</SelectItem>
                    <SelectItem value="Installation">Installation</SelectItem>
                    <SelectItem value="Consultation">Consultation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="machine_id">Machine (Optional)</Label>
                <Select
                  value={formData.machine_id}
                  onValueChange={(value) => setFormData({ ...formData, machine_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select machine (if applicable)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No specific machine">No specific machine</SelectItem>
                    {machines.map((machine) => (
                      <SelectItem key={machine.id} value={machine.id}>
                        {machine.name} - {machine.machine_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the issue or request"
                  rows={4}
                  required
                />
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
