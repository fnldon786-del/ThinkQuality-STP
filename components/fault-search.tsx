"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Search, Wrench, Plus, Eye, Star } from "lucide-react"
import Link from "next/link"

interface Fault {
  id: string
  title: string
  description: string
  equipment_type: string
  severity: string
  category: string
  solution: string
  effectiveness_rating: number
  created_at: string
  created_by: string
}

interface FaultSearchProps {
  userRole: string
  showCreateButton?: boolean
}

export function FaultSearch({ userRole, showCreateButton = false }: FaultSearchProps) {
  const [faults, setFaults] = useState<Fault[]>([])
  const [filteredFaults, setFilteredFaults] = useState<Fault[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchFaults()
  }, [])

  useEffect(() => {
    filterFaults()
  }, [faults, searchTerm, severityFilter, categoryFilter])

  const fetchFaults = async () => {
    try {
      // Mock data for now - replace with actual Supabase query when faults table exists
      const mockData: Fault[] = [
        {
          id: "1",
          title: "Motor Overheating",
          description: "Main motor running at excessive temperature",
          equipment_type: "Electric Motor",
          severity: "High",
          category: "Electrical",
          solution: "Check cooling system, clean air filters, verify electrical connections",
          effectiveness_rating: 4.5,
          created_at: new Date().toISOString(),
          created_by: "technician",
        },
        {
          id: "2",
          title: "Hydraulic Pressure Drop",
          description: "Hydraulic system losing pressure during operation",
          equipment_type: "Hydraulic System",
          severity: "Medium",
          category: "Hydraulic",
          solution: "Inspect seals, check fluid levels, replace worn components",
          effectiveness_rating: 4.2,
          created_at: new Date().toISOString(),
          created_by: "technician",
        },
        {
          id: "3",
          title: "Belt Slippage",
          description: "Drive belt slipping under load",
          equipment_type: "Conveyor",
          severity: "Low",
          category: "Mechanical",
          solution: "Adjust belt tension, check pulley alignment, replace worn belt",
          effectiveness_rating: 4.8,
          created_at: new Date().toISOString(),
          created_by: "technician",
        },
      ]

      setFaults(mockData)
    } catch (error) {
      console.error("Error fetching faults:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterFaults = () => {
    let filtered = faults

    if (searchTerm) {
      filtered = filtered.filter(
        (fault) =>
          fault.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fault.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fault.equipment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          fault.solution.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter((fault) => fault.severity.toLowerCase() === severityFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((fault) => fault.category.toLowerCase() === categoryFilter)
    }

    setFilteredFaults(filtered)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Electrical":
        return "bg-blue-100 text-blue-800"
      case "Mechanical":
        return "bg-purple-100 text-purple-800"
      case "Hydraulic":
        return "bg-cyan-100 text-cyan-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search faults, solutions, equipment..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="mechanical">Mechanical</SelectItem>
            <SelectItem value="hydraulic">Hydraulic</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredFaults.map((fault) => (
          <Card key={fault.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Wrench className="h-5 w-5 text-red-600" />
                  <div>
                    <CardTitle className="text-lg">{fault.title}</CardTitle>
                    <CardDescription>{fault.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getSeverityColor(fault.severity)}>{fault.severity}</Badge>
                  <Badge className={getCategoryColor(fault.category)}>{fault.category}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">Equipment Type</h4>
                <p className="text-sm text-muted-foreground">{fault.equipment_type}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm">Solution</h4>
                <p className="text-sm text-muted-foreground">{fault.solution}</p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Effectiveness:</span>
                  <div className="flex space-x-1">{renderStars(fault.effectiveness_rating)}</div>
                  <span className="text-sm text-muted-foreground">({fault.effectiveness_rating}/5)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {userRole === "Admin" && (
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFaults.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || severityFilter !== "all" || categoryFilter !== "all"
                ? "No faults found matching your criteria."
                : "No faults in the database yet."}
            </p>
            {showCreateButton && userRole === "Admin" && (
              <Button asChild className="mt-4">
                <Link href="/admin/faults/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Fault Solution
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
