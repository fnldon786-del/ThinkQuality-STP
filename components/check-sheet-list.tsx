"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"
import { Search, ClipboardCheck, Plus, Eye } from "lucide-react"
import Link from "next/link"

interface CheckSheet {
  id: string
  title: string
  description: string
  frequency: string
  status: string
  category: string
  created_at: string
  created_by: string
}

interface CheckSheetListProps {
  userRole: string
  showCreateButton?: boolean
}

export function CheckSheetList({ userRole, showCreateButton = false }: CheckSheetListProps) {
  const [checkSheets, setCheckSheets] = useState<CheckSheet[]>([])
  const [filteredSheets, setFilteredSheets] = useState<CheckSheet[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchCheckSheets()
  }, [])

  useEffect(() => {
    filterCheckSheets()
  }, [checkSheets, searchTerm, statusFilter])

  const fetchCheckSheets = async () => {
    try {
      // Mock data for now - replace with actual Supabase query when check_sheets table exists
      const mockData: CheckSheet[] = [
        {
          id: "1",
          title: "Daily Equipment Inspection",
          description: "Daily safety and operational check for main equipment",
          frequency: "Daily",
          status: "Active",
          category: "Safety",
          created_at: new Date().toISOString(),
          created_by: "admin",
        },
        {
          id: "2",
          title: "Weekly Maintenance Check",
          description: "Weekly preventive maintenance checklist",
          frequency: "Weekly",
          status: "Active",
          category: "Maintenance",
          created_at: new Date().toISOString(),
          created_by: "admin",
        },
      ]

      setCheckSheets(mockData)
    } catch (error) {
      console.error("Error fetching check sheets:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterCheckSheets = () => {
    let filtered = checkSheets

    if (searchTerm) {
      filtered = filtered.filter(
        (sheet) =>
          sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sheet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sheet.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((sheet) => sheet.status.toLowerCase() === statusFilter)
    }

    setFilteredSheets(filtered)
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case "Daily":
        return "bg-blue-100 text-blue-800"
      case "Weekly":
        return "bg-green-100 text-green-800"
      case "Monthly":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800"
      case "Draft":
        return "bg-yellow-100 text-yellow-800"
      case "Archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
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
            placeholder="Search check sheets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredSheets.map((sheet) => (
          <Card key={sheet.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">{sheet.title}</CardTitle>
                    <CardDescription>{sheet.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getFrequencyColor(sheet.frequency)}>{sheet.frequency}</Badge>
                  <Badge className={getStatusColor(sheet.status)}>{sheet.status}</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Category:</span> {sheet.category}
                  <span className="ml-4 font-medium">Created:</span> {new Date(sheet.created_at).toLocaleDateString()}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    View
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

      {filteredSheets.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "No check sheets found matching your criteria."
                : "No check sheets available yet."}
            </p>
            {showCreateButton && userRole === "Admin" && (
              <Button asChild className="mt-4">
                <Link href="/admin/check-sheets/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Check Sheet
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
