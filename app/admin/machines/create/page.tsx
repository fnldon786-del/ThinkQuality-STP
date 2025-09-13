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
import { CalendarIcon, ArrowLeft } from "lucide-react"
import { format } from "date-fns"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Customer {
  id: string
  full_name: string
  company_name: string
}

export default function CreateMachinePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [formData, setFormData] = useState({
    name: "",
    model: "",
    serial_number: "",
    manufacturer: "",
    location: "",
    customer_id: "",
    installation_date: undefined as Date | undefined,
    next_maintenance: undefined as Date | undefined,
    maintenance_frequency: "monthly" as "weekly" | "monthly" | "quarterly" | "yearly",
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    console.log("[v0] Loading customers...")
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, company_name")
        .eq("role", "Customer")
        .order("full_name")

      if (error) throw error
      console.log("[v0] Customers loaded:", data?.length || 0)
      setCustomers(data || [])
    } catch (error) {
      console.error("[v0] Error loading customers:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Submitting form data:", formData)

    try {
      const { error } = await supabase.from("machines").insert({
        name: formData.name,
        model: formData.model,
        serial_number: formData.serial_number,
        manufacturer: formData.manufacturer,
        location: formData.location,
        customer_id: formData.customer_id,
        installation_date: formData.installation_date?.toISOString().split("T")[0],
        next_maintenance: formData.next_maintenance?.toISOString().split("T")[0],
        maintenance_frequency: formData.maintenance_frequency,
        notes: formData.notes,
        status: "Active",
      })

      if (error) throw error

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
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_id">Customer</Label>
                  <Select
                    value={formData.customer_id}
                    onValueChange={(value) => {
                      console.log("[v0] Customer selected:", value)
                      setFormData((prev) => ({ ...prev, customer_id: value }))
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.length === 0 ? (
                        <SelectItem value="no-customers" disabled>
                          No customers available
                        </SelectItem>
                      ) : (
                        customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.full_name} ({customer.company_name})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Installation Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-transparent"
                        onClick={() => console.log("[v0] Installation date picker clicked")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.installation_date ? format(formData.installation_date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.installation_date}
                        onSelect={(date) => {
                          console.log("[v0] Installation date selected:", date)
                          setFormData((prev) => ({ ...prev, installation_date: date }))
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Next Maintenance</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-transparent"
                        onClick={() => console.log("[v0] Maintenance date picker clicked")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.next_maintenance ? format(formData.next_maintenance, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.next_maintenance}
                        onSelect={(date) => {
                          console.log("[v0] Maintenance date selected:", date)
                          setFormData((prev) => ({ ...prev, next_maintenance: date }))
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
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
