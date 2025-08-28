"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface Fault {
  id: string
  machine_id: string
  machine_name: string
  fault_code: string
  fault_description: string
  symptoms: string
  root_cause: string
  solution: string
  parts_required: string[]
  estimated_time: number
  priority: "low" | "medium" | "high" | "critical"
  category: string
  status: "active" | "resolved" | "archived"
  created_at: string
  updated_at: string
}

export default function FaultsPage() {
  const [faults, setFaults] = useState<Fault[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingFault, setEditingFault] = useState<Fault | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [formData, setFormData] = useState({
    machine_id: "",
    fault_code: "",
    fault_description: "",
    symptoms: "",
    root_cause: "",
    solution: "",
    parts_required: "",
    estimated_time: "",
    priority: "medium" as const,
    category: "",
    status: "active" as const,
  })

  useEffect(() => {
    fetchFaults()
  }, [])

  const fetchFaults = async () => {
    try {
      const { data, error } = await supabase
        .from("faults")
        .select(`
          *,
          machines(name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedFaults =
        data?.map((fault) => ({
          ...fault,
          machine_name: fault.machines?.name || "Unknown Machine",
          parts_required: fault.parts_required || [],
        })) || []

      setFaults(formattedFaults)
    } catch (error) {
      console.error("Error fetching faults:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const faultData = {
        ...formData,
        parts_required: formData.parts_required
          .split(",")
          .map((part) => part.trim())
          .filter(Boolean),
        estimated_time: Number.parseInt(formData.estimated_time) || 0,
      }

      if (editingFault) {
        const { error } = await supabase.from("faults").update(faultData).eq("id", editingFault.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("faults").insert([faultData])

        if (error) throw error
      }

      await fetchFaults()
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      console.error("Error saving fault:", error)
    }
  }

  const resetForm = () => {
    setFormData({
      machine_id: "",
      fault_code: "",
      fault_description: "",
      symptoms: "",
      root_cause: "",
      solution: "",
      parts_required: "",
      estimated_time: "",
      priority: "medium",
      category: "",
      status: "active",
    })
    setEditingFault(null)
  }

  const handleEdit = (fault: Fault) => {
    setEditingFault(fault)
    setFormData({
      machine_id: fault.machine_id,
      fault_code: fault.fault_code,
      fault_description: fault.fault_description,
      symptoms: fault.symptoms,
      root_cause: fault.root_cause,
      solution: fault.solution,
      parts_required: fault.parts_required.join(", "),
      estimated_time: fault.estimated_time.toString(),
      priority: fault.priority,
      category: fault.category,
      status: fault.status,
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this fault record?")) return

    try {
      const { error } = await supabase.from("faults").delete().eq("id", id)

      if (error) throw error
      await fetchFaults()
    } catch (error) {
      console.error("Error deleting fault:", error)
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "medium":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "low":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredFaults = faults.filter((fault) => {
    const matchesSearch =
      fault.fault_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.fault_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.machine_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || fault.category === selectedCategory
    const matchesPriority = selectedPriority === "all" || fault.priority === selectedPriority

    return matchesSearch && matchesCategory && matchesPriority
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading faults...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fault & Fix Database</h1>
          <p className="text-muted-foreground">Manage fault records and solutions</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Fault Record
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingFault ? "Edit Fault Record" : "Add New Fault Record"}</DialogTitle>
              <DialogDescription>
                Create a comprehensive fault record with symptoms, causes, and solutions.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fault_code">Fault Code</Label>
                  <Input
                    id="fault_code"
                    value={formData.fault_code}
                    onChange={(e) => setFormData({ ...formData, fault_code: e.target.value })}
                    placeholder="e.g., F001"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Mechanical, Electrical"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fault_description">Fault Description</Label>
                <Input
                  id="fault_description"
                  value={formData.fault_description}
                  onChange={(e) => setFormData({ ...formData, fault_description: e.target.value })}
                  placeholder="Brief description of the fault"
                  required
                />
              </div>

              <div>
                <Label htmlFor="symptoms">Symptoms</Label>
                <Textarea
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="Observable symptoms of the fault"
                  required
                />
              </div>

              <div>
                <Label htmlFor="root_cause">Root Cause</Label>
                <Textarea
                  id="root_cause"
                  value={formData.root_cause}
                  onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
                  placeholder="Identified root cause of the fault"
                  required
                />
              </div>

              <div>
                <Label htmlFor="solution">Solution</Label>
                <Textarea
                  id="solution"
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  placeholder="Step-by-step solution"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parts_required">Parts Required</Label>
                  <Input
                    id="parts_required"
                    value={formData.parts_required}
                    onChange={(e) => setFormData({ ...formData, parts_required: e.target.value })}
                    placeholder="Part1, Part2, Part3"
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_time">Estimated Time (minutes)</Label>
                  <Input
                    id="estimated_time"
                    type="number"
                    value={formData.estimated_time}
                    onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                    placeholder="120"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingFault ? "Update" : "Create"} Fault Record</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find specific fault records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search faults..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Mechanical">Mechanical</SelectItem>
                <SelectItem value="Electrical">Electrical</SelectItem>
                <SelectItem value="Software">Software</SelectItem>
                <SelectItem value="Hydraulic">Hydraulic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fault Records ({filteredFaults.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Est. Time</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFaults.map((fault) => (
                <TableRow key={fault.id}>
                  <TableCell className="font-mono">{fault.fault_code}</TableCell>
                  <TableCell>{fault.fault_description}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{fault.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getPriorityIcon(fault.priority)}
                      <span className="capitalize">{fault.priority}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        fault.status === "active" ? "default" : fault.status === "resolved" ? "secondary" : "outline"
                      }
                    >
                      {fault.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{fault.estimated_time}min</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(fault)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(fault.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
