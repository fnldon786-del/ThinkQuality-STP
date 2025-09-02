"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, CheckCircle, Calendar, Eye, Star } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface CompletedWork {
  id: string
  title: string
  type: string
  priority: string
  completed_at: string
  technician_name: string
  work_performed: string
  customer_rating: number | null
  customer_feedback: string | null
  total_time: number | null
}

export default function CustomerCompletedPage() {
  const [completedWork, setCompletedWork] = useState<CompletedWork[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState("all")
  const [dateRange, setDateRange] = useState("all")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchCompletedWork()
  }, [])

  const fetchCompletedWork = async () => {
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
          priority,
          completed_at,
          work_performed,
          customer_rating,
          customer_feedback,
          total_time,
          customer_company,
          profiles!job_cards_assigned_to_fkey(full_name)
        `)
        .eq("customer_company", profile.company_name)
        .eq("status", "completed")
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false })

      if (error) throw error

      const formattedWork =
        data?.map((work) => ({
          id: work.id,
          title: work.title,
          type: work.type,
          priority: work.priority,
          completed_at: work.completed_at,
          technician_name: work.profiles?.full_name || "Unknown",
          work_performed: work.work_performed || "",
          customer_rating: work.customer_rating,
          customer_feedback: work.customer_feedback,
          total_time: work.total_time,
        })) || []

      setCompletedWork(formattedWork)
    } catch (error) {
      console.error("Error fetching completed work:", error)
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

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-muted-foreground">Not rated</span>

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={`h-4 w-4 ${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
        ))}
        <span className="text-sm text-muted-foreground ml-1">({rating}/5)</span>
      </div>
    )
  }

  const filteredWork = completedWork.filter((work) => {
    const matchesSearch =
      work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.technician_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || work.type === selectedType

    let matchesDate = true
    if (dateRange !== "all") {
      const workDate = new Date(work.completed_at)
      const now = new Date()
      switch (dateRange) {
        case "week":
          matchesDate = workDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case "month":
          matchesDate = workDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case "quarter":
          matchesDate = workDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
      }
    }

    return matchesSearch && matchesType && matchesDate
  })

  if (loading) {
    return (
      <DashboardLayout role="Customer">
        <div className="flex items-center justify-center h-64">Loading completed work...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Customer">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Completed Work</h2>
          <p className="text-muted-foreground mt-2">Review completed maintenance and service work</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
            <CardDescription>Find specific completed work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search completed work..."
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
            <CardTitle>Completed Work ({filteredWork.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Work</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWork.map((work) => (
                  <TableRow key={work.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{work.title}</div>
                        <div className="text-sm text-muted-foreground">ID: {work.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(work.type)}>{work.type}</Badge>
                    </TableCell>
                    <TableCell>{work.technician_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(work.completed_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>{renderStars(work.customer_rating)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        {!work.customer_rating && (
                          <Button variant="outline" size="sm">
                            <Star className="h-4 w-4 mr-2" />
                            Rate
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {filteredWork.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Completed Work Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedType !== "all" || dateRange !== "all"
                  ? "Try adjusting your search criteria"
                  : "No completed work available"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
