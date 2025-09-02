"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { QRCodeGenerator } from "@/components/qr-code-generator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Settings, MapPin, QrCode, Download } from "lucide-react"
import { toast } from "sonner"

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
  qr_code: string
  customer_company: string
  created_at: string
}

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false)

  const [newMachine, setNewMachine] = useState({
    machine_number: "",
    name: "",
    description: "",
    model: "",
    serial_number: "",
    manufacturer: "",
    location: "",
    status: "Active",
    customer_company: "",
  })

  useEffect(() => {
    fetchMachines()
  }, [])

  const fetchMachines = async () => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase.from("machines").select("*").order("created_at", { ascending: false })

      if (error) throw error
      setMachines(data || [])
    } catch (error) {
      console.error("Error fetching machines:", error)
      toast.error("Failed to load machines")
    } finally {
      setLoading(false)
    }
  }

  const handleAddMachine = async () => {
    const supabase = createClient()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("machines").insert([
        {
          ...newMachine,
          created_by: user.id,
        },
      ])

      if (error) throw error

      toast.success("Machine added successfully")
      setIsAddDialogOpen(false)
      setNewMachine({
        machine_number: "",
        name: "",
        description: "",
        model: "",
        serial_number: "",
        manufacturer: "",
        location: "",
        status: "Active",
        customer_company: "",
      })
      fetchMachines()
    } catch (error) {
      console.error("Error adding machine:", error)
      toast.error("Failed to add machine")
    }
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

  const filteredMachines = machines.filter(
    (machine) =>
      machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.machine_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      machine.customer_company.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const downloadQRCode = (machine: Machine) => {
    const canvas = document.querySelector(`canvas[data-machine="${machine.id}"]`) as HTMLCanvasElement
    if (canvas) {
      const link = document.createElement("a")
      link.download = `${machine.machine_number}-qr-code.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Machine Management</h2>
            <p className="text-muted-foreground mt-2">Manage customer machines and generate QR codes</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Machine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Machine</DialogTitle>
                <DialogDescription>
                  Add a new machine to the system. A unique QR code will be generated automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="machine_number">Machine Number</Label>
                  <Input
                    id="machine_number"
                    value={newMachine.machine_number}
                    onChange={(e) => setNewMachine({ ...newMachine, machine_number: e.target.value })}
                    placeholder="e.g., M001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Machine Name</Label>
                  <Input
                    id="name"
                    value={newMachine.name}
                    onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
                    placeholder="e.g., CNC Machine"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={newMachine.model}
                    onChange={(e) => setNewMachine({ ...newMachine, model: e.target.value })}
                    placeholder="e.g., XYZ-2000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    value={newMachine.serial_number}
                    onChange={(e) => setNewMachine({ ...newMachine, serial_number: e.target.value })}
                    placeholder="e.g., SN123456"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={newMachine.manufacturer}
                    onChange={(e) => setNewMachine({ ...newMachine, manufacturer: e.target.value })}
                    placeholder="e.g., ACME Corp"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newMachine.location}
                    onChange={(e) => setNewMachine({ ...newMachine, location: e.target.value })}
                    placeholder="e.g., Factory Floor A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customer_company">Customer Company</Label>
                  <Input
                    id="customer_company"
                    value={newMachine.customer_company}
                    onChange={(e) => setNewMachine({ ...newMachine, customer_company: e.target.value })}
                    placeholder="e.g., ABC Manufacturing"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newMachine.status}
                    onValueChange={(value) => setNewMachine({ ...newMachine, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Decommissioned">Decommissioned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newMachine.description}
                    onChange={(e) => setNewMachine({ ...newMachine, description: e.target.value })}
                    placeholder="Machine description..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddMachine}>Add Machine</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search machines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Machines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMachines.map((machine) => (
            <Card key={machine.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{machine.name}</CardTitle>
                    <CardDescription>{machine.machine_number}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(machine.status)}>{machine.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    <span>{machine.model || "No model"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{machine.location || "No location"}</span>
                  </div>
                  <div className="text-muted-foreground">Company: {machine.customer_company}</div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedMachine(machine)
                      setIsQRDialogOpen(true)
                    }}
                  >
                    <QrCode className="h-4 w-4 mr-1" />
                    QR Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredMachines.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No machines found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? "Try adjusting your search terms." : "Add your first machine to get started."}
            </p>
          </div>
        )}

        {/* QR Code Dialog */}
        <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Machine QR Code</DialogTitle>
              <DialogDescription>
                {selectedMachine?.name} ({selectedMachine?.machine_number})
              </DialogDescription>
            </DialogHeader>
            {selectedMachine && (
              <div className="text-center space-y-4">
                <div data-machine={selectedMachine.id}>
                  <QRCodeGenerator value={`${window.location.origin}/machine/${selectedMachine.qr_code}`} size={200} />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>QR Code: {selectedMachine.qr_code}</p>
                  <p>
                    URL: {window.location.origin}/machine/{selectedMachine.qr_code}
                  </p>
                </div>
                <Button onClick={() => downloadQRCode(selectedMachine)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
