"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, QrCode, Settings, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import Link from "next/link"

interface Machine {
  id: string
  machine_number: string
  name: string
  model: string
  serial_number: string
  location: string
  status: string
  qr_code: string
  next_maintenance: string
  customer: {
    full_name: string
    company_name: string
  }
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadMachines()
  }, [])

  useEffect(() => {
    filterMachines()
  }, [machines, searchTerm])

  const loadMachines = async () => {
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from("machines")
        .select(
          `
          *,
          customer:customer_id(full_name, company_name)
        `,
        )
        .order("created_at", { ascending: false })

      if (error) throw error
      setMachines(data || [])
    } catch (error) {
      console.error("Error loading machines:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterMachines = () => {
    let filtered = machines

    if (searchTerm) {
      filtered = filtered.filter(
        (machine) =>
          machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          machine.machine_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          machine.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
          machine.customer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredMachines(filtered)
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

  const getQRCodeUrl = (qrCode: string) => {
    return `${window.location.origin}/machine/${qrCode}`
  }

  if (isLoading) {
    return (
      <DashboardLayout role="Admin">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Machine Management</h2>
        </div>

        <div className="flex gap-3 pb-4 border-b">
          <Button asChild>
            <Link href="/admin/machines/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Machine
            </Link>
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <Input
              placeholder="Search machines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Machines Grid */}
        {filteredMachines.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No machines found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMachines.map((machine) => (
              <Card key={machine.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{machine.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{machine.machine_number}</p>
                    </div>
                    <Badge className={getStatusColor(machine.status)}>{machine.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Model:</strong> {machine.model}
                    </p>
                    <p>
                      <strong>Serial:</strong> {machine.serial_number}
                    </p>
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
                    {machine.next_maintenance && (
                      <p>
                        <strong>Next Maintenance:</strong> {format(new Date(machine.next_maintenance), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedMachine(machine)}
                          className="flex-1"
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          QR Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>QR Code - {machine.name}</DialogTitle>
                        </DialogHeader>
                        <div className="text-center space-y-4">
                          <QRCodeGenerator value={getQRCodeUrl(machine.qr_code)} size={200} className="mx-auto" />
                          <div>
                            <p className="text-sm text-muted-foreground mb-2">Scan to access machine portal</p>
                            <p className="text-xs font-mono bg-muted p-2 rounded">{getQRCodeUrl(machine.qr_code)}</p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/admin/machines/${machine.id}`}>
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
