"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { Footer } from "@/components/footer"
import { AlertTriangle, Calendar, FileText, ClipboardCheck, Wrench, History, MapPin } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import Link from "next/link"

interface Machine {
  id: string
  machine_number: string
  name: string
  model: string
  serial_number: string
  manufacturer: string
  location: string
  status: string
  last_maintenance: string
  next_maintenance: string
  customer: {
    full_name: string
    company_name: string
  }
}

interface MaintenanceSchedule {
  id: string
  maintenance_type: string
  next_due: string
  frequency_days: number
}

interface BreakdownRequest {
  id: string
  request_number: string
  title: string
  status: string
  urgency: string
  reported_at: string
}

export default function MachineQRPage() {
  const params = useParams()
  const router = useRouter()
  const qrCode = params.qrCode as string
  const [machine, setMachine] = useState<Machine | null>(null)
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceSchedule[]>([])
  const [recentBreakdowns, setRecentBreakdowns] = useState<BreakdownRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMachineData()
  }, [qrCode])

  const loadMachineData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load machine details
      const { data: machineData, error: machineError } = await supabase
        .from("machines")
        .select(
          `
          *,
          customer:customer_id(full_name, company_name)
        `,
        )
        .eq("qr_code", qrCode)
        .single()

      if (machineError) throw machineError
      setMachine(machineData)

      // Load maintenance schedules
      const { data: schedules } = await supabase
        .from("machine_maintenance_schedules")
        .select("*")
        .eq("machine_id", machineData.id)
        .order("next_due", { ascending: true })

      setMaintenanceSchedules(schedules || [])

      // Load recent breakdown requests
      const { data: breakdowns } = await supabase
        .from("breakdown_requests")
        .select("*")
        .eq("machine_id", machineData.id)
        .order("reported_at", { ascending: false })
        .limit(5)

      setRecentBreakdowns(breakdowns || [])
    } catch (error: unknown) {
      console.error("Error loading machine data:", error)
      setError(error instanceof Error ? error.message : "Failed to load machine data")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "Inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !machine) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card shadow-sm p-4">
          <Logo size="md" showText={true} />
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Machine Not Found</h2>
              <p className="text-muted-foreground">
                The QR code you scanned does not correspond to a valid machine in our system.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card shadow-sm p-4">
        <Logo size="md" showText={true} />
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          {/* Machine Info */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{machine.name}</CardTitle>
                  <p className="text-muted-foreground">{machine.machine_number}</p>
                </div>
                <Badge className={getStatusColor(machine.status)}>{machine.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p>
                    <strong>Model:</strong> {machine.model}
                  </p>
                  <p>
                    <strong>Serial Number:</strong> {machine.serial_number}
                  </p>
                  <p>
                    <strong>Manufacturer:</strong> {machine.manufacturer}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{machine.location}</span>
                  </div>
                  <p>
                    <strong>Customer:</strong> {machine.customer.full_name}
                  </p>
                  <p>
                    <strong>Company:</strong> {machine.customer.company_name}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <Link href={`/machine/${qrCode}/breakdown`}>
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Report Breakdown</h3>
                  <p className="text-sm text-muted-foreground">Submit breakdown request</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <Link href={`/machine/${qrCode}/sops`}>
                <CardContent className="p-4 text-center">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold">SOPs</h3>
                  <p className="text-sm text-muted-foreground">Operating procedures</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <Link href={`/machine/${qrCode}/check-sheets`}>
                <CardContent className="p-4 text-center">
                  <ClipboardCheck className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold">Check Sheets</h3>
                  <p className="text-sm text-muted-foreground">Inspection checklists</p>
                </CardContent>
              </Link>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <Link href={`/machine/${qrCode}/history`}>
                <CardContent className="p-4 text-center">
                  <History className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold">History</h3>
                  <p className="text-sm text-muted-foreground">Breakdown history</p>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Maintenance Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Planned Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceSchedules.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No maintenance scheduled</p>
              ) : (
                <div className="space-y-3">
                  {maintenanceSchedules.slice(0, 3).map((schedule) => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{schedule.maintenance_type}</h4>
                        <p className="text-sm text-muted-foreground">Every {schedule.frequency_days} days</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{format(new Date(schedule.next_due), "MMM d, yyyy")}</p>
                        <p className="text-xs text-muted-foreground">Next due</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Breakdowns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Recent Breakdown Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentBreakdowns.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No recent breakdown requests</p>
              ) : (
                <div className="space-y-3">
                  {recentBreakdowns.map((breakdown) => (
                    <div key={breakdown.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{breakdown.title}</h4>
                          <Badge className={getUrgencyColor(breakdown.urgency)}>{breakdown.urgency}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{breakdown.request_number}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{breakdown.status}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(breakdown.reported_at), "MMM d")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  )
}
