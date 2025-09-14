"use client"

import type React from "react"

import { DashboardLayout } from "@/components/dashboard-layout"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ArrowLeft, CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface Company {
  id: string
  name: string
  contact_email: string
}

export default function CreateMachinePage() {
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    serial_number: "",
    manufacturer: "",
    location: "",
    company_id: "",
    installation_date: undefined as Date | undefined,
    maintenance_frequency: "monthly" as "weekly" | "monthly" | "quarterly" | "yearly",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    console.log("[v0] Loading companies...")
    try {
      const { data, error } = await supabase.from("companies").select("id, name, contact_email").order("name")

      if (error) throw error
      console.log("[v0] Companies loaded:", data?.length || 0)
      setCompanies(data || [])
    } catch (error) {
      console.error("[v0] Error loading companies:", error)
    }
  }

  const calculateNextMaintenanceDate = (installationDate: Date, frequency: string): Date => {
    const nextDate = new Date(installationDate)

    switch (frequency) {
      case "weekly":
        nextDate.setDate(nextDate.getDate() + 7)
        break
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + 1)
        break
      case "quarterly":
        nextDate.setMonth(nextDate.getMonth() + 3)
        break
      case "yearly":
        nextDate.setFullYear(nextDate.getFullYear() + 1)
        break
    }

    return nextDate
  }

  const generateMaintenanceRequest = async (machineId: string, dueDate: Date, frequency: string) => {
    try {
      const requestNumber = `MNT-${Date.now()}`

      const { error } = await supabase.from("customer_requests").insert({
        title: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Maintenance`,
        description: `Scheduled ${frequency} maintenance for machine`,
        request_type: "maintenance",
        status: "pending",
        priority: frequency === "weekly" || frequency === "monthly" ? "high" : "medium",
        due_date: dueDate.toISOString(),
        machine_id: machineId,
        request_number: requestNumber,
        notes: `Auto-generated ${frequency} maintenance request`,
      })

      if (error) throw error
      console.log("[v0] Maintenance request created:", requestNumber)
    } catch (error) {
      console.error("[v0] Error creating maintenance request:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Submitting form data:", formData)

    try {
      let nextMaintenanceDate = null
      if (formData.installation_date) {
        nextMaintenanceDate = calculateNextMaintenanceDate(formData.installation_date, formData.maintenance_frequency)
      }

      const { data: machineData, error } = await supabase
        .from("machines")
        .insert({
          name: formData.name,
          model: formData.model,
          serial_number: formData.serial_number,
          manufacturer: formData.manufacturer,
          location: formData.location,
          company_id: formData.company_id,
          installation_date: formData.installation_date?.toISOString().split("T")[0],
          next_maintenance_date: nextMaintenanceDate?.toISOString().split("T")[0],
          maintenance_frequency: formData.maintenance_frequency,
          notes: formData.notes,
          status: "Active",
        })
        .select()
        .single()

      if (error) throw error

      if (
        machineData &&
        nextMaintenanceDate &&
        (formData.maintenance_frequency === "monthly" || formData.maintenance_frequency === "weekly")
      ) {
        await generateMaintenanceRequest(machineData.id, nextMaintenanceDate, formData.maintenance_frequency)
      }

      console.log("[v0] Machine created successfully")
      router.push("/admin/machines")
    } catch (error: unknown) {
      console.error("[v0] Error creating machine:", error)
      setError(error instanceof Error ? error.message : "Failed to create machine")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/machines">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Machines
            </Link>
          </Button>
          <div>
            <h2 className="text-3xl font-bold text-foreground">Add New Machine</h2>
            <p className="text-muted-foreground mt-2">Create a new machine with automatic QR code generation</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Machine Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Machine Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter machine name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                    placeholder="Machine model"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, serial_number: e.target.value }))}
                    placeholder="Serial number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData((prev) => ({ ...prev, manufacturer: e.target.value }))}
                    placeholder="Manufacturer name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Machine location"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company_id">Company</Label>
                  <Select
                    value={formData.company_id}
                    onValueChange={(value) => {
                      console.log("[v0] Company selected:", value)
                      setFormData((prev) => ({ ...prev, company_id: value }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Installation Date</Label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.installation_date && "text-muted-foreground",
                        )}
                        type="button"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.installation_date ? (
                          format(formData.installation_date, "PPP")
                        ) : (
                          <span>Pick installation date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.installation_date}
                        onSelect={(date) => {
                          setFormData((prev) => ({ ...prev, installation_date: date }))
                          setIsDatePickerOpen(false)
                        }}
                        disabled={(date) => date > new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenance_frequency">Maintenance Frequency</Label>
                  <Select
                    value={formData.maintenance_frequency}
                    onValueChange={(value: "weekly" | "monthly" | "quarterly" | "yearly") => {
                      console.log("[v0] Maintenance frequency selected:", value)
                      setFormData((prev) => ({ ...prev, maintenance_frequency: value }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select maintenance frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes about the machine"
                  rows={3}
                />
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Machine"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/admin/machines">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
