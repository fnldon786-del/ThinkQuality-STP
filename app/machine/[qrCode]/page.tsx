"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, FileText, ClipboardCheck, History, Calendar, MapPin, Settings } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Machine {
  id: string
  machine_number: string
  name: string
  description: string
  model: string
  serial_number: string
  manufacturer: string
  location: string
  status: string
  customer_company: string
}

interface MaintenanceSchedule {
  id: string
  title: string
  next_due: string
  status: string
  maintenance_type: string
}

interface BreakdownHistory {
  id: string
  breakdown_date: string
  description: string
  status: string
  downtime_hours: number
}

export default function MachinePortalPage() {
  const params = useParams()
  const qrCode = params.qrCode as string
  const [machine, setMachine] = useState<Machine | null>(null)
  const [maintenance, setMaintenance] = useState<MaintenanceSchedule[]>([])
  const [breakdowns, setBreakdowns] = useState<BreakdownHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMachineData = async () => {
      const supabase = createClient()

      try {
        // Fetch machine details
        const { data: machineData, error: machineError } = await supabase
          .from("machines")
          .select("*")
          .eq("qr_code", qrCode)
          .single()

        if (machineError || !machineData) {
          setError("Machine not found")
          return
        }

        setMachine(machineData)

        // Fetch maintenance schedule
        const { data: maintenanceData } = await supabase
          .from("machine_maintenance")
          .select("*")
          .eq("machine_id", machineData.id)
          .order("next_due", { ascending: true })
          .limit(5)

        setMaintenance(maintenanceData || [])

        // Fetch breakdown history
        const { data: breakdownData } = await supabase
          .from("machine_breakdowns")
          .select("*")
          .eq("machine_id", machineData.id)
          .order("breakdown_date", { ascending: false })
          .limit(10)

        setBreakdowns(breakdownData || [])
      } catch (err) {
        setError("Failed to load machine data")
        console.error("Error fetching machine data:", err)
      } finally {
        setLoading(false)
      }
    }

    if (qrCode) {
      fetchMachineData()
    }
  }, [qrCode])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading machine portal...</p>
        </div>
      </div>
    )
  }

  if (error || !machine) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Machine Not Found</CardTitle>
            <CardDescription>
              The QR code you scanned is not valid or the machine is no longer available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-gray-100 text-gray-800"
      case "decommissioned":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 relative">
                <Image src="/images/stp-logo.png" alt="STP Engineering" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{machine.name}</h1>
                <p className="text-muted-foreground">{machine.machine_number}</p>
              </div>
            </div>
            <Badge className={getStatusColor(machine.status)}>{machine.status}</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Machine Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Machine Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Model</p>
                <p className="text-foreground">{machine.model || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Serial Number</p>
                <p className="text-foreground">{machine.serial_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Manufacturer</p>
                <p className="text-foreground">{machine.manufacturer || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Location</p>
                <p className="text-foreground flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {machine.location || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Company</p>
                <p className="text-foreground">{machine.customer_company}</p>
              </div>
            </div>
            {machine.description && (
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-foreground">{machine.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Report Breakdown</h3>
              <p className="text-sm text-muted-foreground mb-4">Submit a breakdown request</p>
              <Button asChild className="w-full">
                <Link href={`/machine/${qrCode}/breakdown`}>Report Issue</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">SOPs</h3>
              <p className="text-sm text-muted-foreground mb-4">Access procedures</p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/machine/${qrCode}/sops`}>View SOPs</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <ClipboardCheck className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Check Sheets</h3>
              <p className="text-sm text-muted-foreground mb-4">Quality inspections</p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/machine/${qrCode}/checksheets`}>View Checks</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6 text-center">
              <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Maintenance</h3>
              <p className="text-sm text-muted-foreground mb-4">Scheduled maintenance</p>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href={`/machine/${qrCode}/maintenance`}>View Schedule</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Maintenance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maintenance.length > 0 ? (
                <div className="space-y-3">
                  {maintenance.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(item.next_due).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={item.status === "Overdue" ? "destructive" : "secondary"}>{item.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No scheduled maintenance</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Breakdowns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Breakdowns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {breakdowns.length > 0 ? (
                <div className="space-y-3">
                  {breakdowns.slice(0, 3).map((breakdown) => (
                    <div key={breakdown.id} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-muted-foreground">
                          {new Date(breakdown.breakdown_date).toLocaleDateString()}
                        </p>
                        <Badge variant={breakdown.status === "Resolved" ? "secondary" : "destructive"}>
                          {breakdown.status}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm">{breakdown.description}</p>
                      {breakdown.downtime_hours && (
                        <p className="text-xs text-muted-foreground mt-1">Downtime: {breakdown.downtime_hours}h</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">No breakdown history</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <Separator className="mb-4" />
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-semibold">ThinkQuality</span>
          </p>
        </div>
      </div>
    </div>
  )
}
