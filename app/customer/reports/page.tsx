"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, FileText, Download, Eye, Calendar } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface ServiceReport {
  id: string
  job_card_id: string
  title: string
  type: string
  status: string
  completed_at: string
  technician_name: string
  work_performed: string
  parts_used: string[]
  recommendations: string
  customer_company: string
}

export default function CustomerReportsPage() {
  const [reports, setReports] = useState<ServiceReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [dateRange, setDateRange] = useState("all")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("company_name").eq("id", user.id).single()

      if (!profile?.company_name) return

      const { data, error } = await supabase
        .from("job_cards")
        .select(`
          id,
          title,
          type,
          status,
          completed_at,
          work_performed,
          parts_used,
          recommendations,
          customer_company,
          profiles!job_cards_assigned_to_fkey(full_name)
        `)
        .eq("customer_company", profile.company_name)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })

      if (error) throw error

      const formattedReports =
        data?.map((report) => ({
          id: report.id,
          job_card_id: report.id,
          title: report.title,
          type: report.type,
          status: report.status,
          completed_at: report.completed_at,
          technician_name: report.profiles?.full_name || "Unknown",
          work_performed: report.work_performed || "",
          parts_used: report.parts_used || [],
          recommendations: report.recommendations || "",
          customer_company: report.customer_company,
        })) || []

      setReports(formattedReports)
    } catch (error) {
      console.error("Error fetching reports:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "maintenance":
        return "bg-blue-100 text-blue-800"
      case "repair":
        return "bg-red-100 text-red-800"
      case "inspection":
        return "bg-green-100 text-green-800"
      case "installation":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.technician_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || report.type === selectedType

    let matchesDate = true
    if (dateRange !== "all") {
      const reportDate = new Date(report.completed_at)
      const now = new Date()
      switch (dateRange) {
        case "week":
          matchesDate = reportDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          matchesDate = reportDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case "quarter":
          matchesDate = reportDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
      }
    }

    return matchesSearch && matchesType && matchesDate
  })

  if (loading) {
    return (
      <DashboardLayout role="Customer">
        <div className="flex items-center justify-center h-64">Loading service reports...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Customer">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Service Reports</h2>
          <p className="text-muted-foreground mt-2">View completed service reports and documentation</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find specific service reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Service Reports ({filteredReports.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{report.title}</div>
                        <div className="text-sm text-muted-foreground">ID: {report.job_card_id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(report.type)}>{report.type}</Badge>
                    </TableCell>
                    <TableCell>{report.technician_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(report.completed_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Reports Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedType !== "all" || dateRange !== "all"
                  ? "Try adjusting your search criteria"
                  : "No completed service reports available"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
