"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, AlertTriangle, CheckCircle, Clock, Eye, Copy } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
}

export default function TechnicianFaultsPage() {
  const [faults, setFaults] = useState<Fault[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedFault, setSelectedFault] = useState<Fault | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

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
        .eq("status", "active")
        .order("priority", { ascending: false })
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const filteredFaults = faults.filter((fault) => {
    const matchesSearch =
      fault.fault_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.fault_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fault.symptoms.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || fault.category === selectedCategory
    const matchesPriority = selectedPriority === "all" || fault.priority === selectedPriority

    return matchesSearch && matchesCategory && matchesPriority
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading fault database...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Fault Database</h1>
          <p className="text-muted-foreground">Search and reference fault solutions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find fault solutions and troubleshooting guides</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search faults, symptoms, or solutions..."
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
                      <Badge className={getPriorityColor(fault.priority)}>{fault.priority}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>{fault.estimated_time}min</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedFault(fault)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Solution
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            {getPriorityIcon(fault.priority)}
                            {fault.fault_code}: {fault.fault_description}
                          </DialogTitle>
                          <DialogDescription>
                            Category: {fault.category} | Estimated Time: {fault.estimated_time} minutes
                          </DialogDescription>
                        </DialogHeader>

                        {selectedFault && (
                          <div className="space-y-6">
                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                Symptoms
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(selectedFault.symptoms)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </h4>
                              <p className="text-sm bg-muted p-3 rounded">{selectedFault.symptoms}</p>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                Root Cause
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(selectedFault.root_cause)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </h4>
                              <p className="text-sm bg-muted p-3 rounded">{selectedFault.root_cause}</p>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2 flex items-center gap-2">
                                Solution
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(selectedFault.solution)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </h4>
                              <div className="text-sm bg-muted p-3 rounded whitespace-pre-wrap">
                                {selectedFault.solution}
                              </div>
                            </div>

                            {selectedFault.parts_required.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">Parts Required</h4>
                                <div className="flex flex-wrap gap-2">
                                  {selectedFault.parts_required.map((part, index) => (
                                    <Badge key={index} variant="secondary">
                                      {part}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredFaults.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Faults Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "all" || selectedPriority !== "all"
                ? "Try adjusting your search criteria"
                : "No fault records match your current filters"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
