"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileText, CheckCircle, Clock, AlertTriangle, Eye } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"

interface CheckSheet {
  id: string
  title: string
  description: string
  category: string
  frequency: string
  estimated_duration: number
  status: "active" | "draft" | "archived"
  last_completed: string | null
  completion_count: number
  created_at: string
}

export default function TechnicianCheckSheetsPage() {
  const [checkSheets, setCheckSheets] = useState<CheckSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchCheckSheets()
  }, [])

  const fetchCheckSheets = async () => {
    try {
      const { data, error } = await supabase
        .from("check_sheets")
        .select(`
          *,
          check_sheet_completions(count)
        `)
        .eq("status", "active")
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedSheets =
        data?.map((sheet) => ({
          ...sheet,
          completion_count: sheet.check_sheet_completions?.[0]?.count || 0,
        })) || []

      setCheckSheets(formattedSheets)
    } catch (error) {
      console.error("Error fetching check sheets:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "draft":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "archived":
        return <AlertTriangle className="h-4 w-4 text-gray-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      daily: "bg-blue-100 text-blue-800",
      weekly: "bg-green-100 text-green-800",
      monthly: "bg-purple-100 text-purple-800",
      quarterly: "bg-orange-100 text-orange-800",
      yearly: "bg-red-100 text-red-800",
    }
    return colors[frequency as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const filteredCheckSheets = checkSheets.filter((sheet) => {
    const matchesSearch =
      sheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sheet.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || sheet.category === selectedCategory
    const matchesStatus = selectedStatus === "all" || sheet.status === selectedStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading check sheets...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Check Sheets</h1>
          <p className="text-muted-foreground">Complete inspection and maintenance check sheets</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>Find specific check sheets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search check sheets..."
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
                <SelectItem value="Safety">Safety</SelectItem>
                <SelectItem value="Quality">Quality</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Inspection">Inspection</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredCheckSheets.map((sheet) => (
          <Card key={sheet.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(sheet.status)}
                    <h3 className="text-lg font-semibold">{sheet.title}</h3>
                    <Badge variant="outline" className={getFrequencyBadge(sheet.frequency)}>
                      {sheet.frequency}
                    </Badge>
                  </div>

                  <p className="text-muted-foreground mb-3">{sheet.description}</p>

                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>Category: {sheet.category}</span>
                    <span>Duration: {sheet.estimated_duration} min</span>
                    <span>Completed: {sheet.completion_count} times</span>
                    {sheet.last_completed && <span>Last: {new Date(sheet.last_completed).toLocaleDateString()}</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/technician/check-sheets/${sheet.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View & Complete
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCheckSheets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Check Sheets Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "all" || selectedStatus !== "all"
                ? "Try adjusting your search criteria"
                : "No check sheets are currently available"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
