"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { Plus, Search, ClipboardCheck, Users, FileText } from "lucide-react"
import { toast } from "sonner"

interface CheckSheet {
  id: string
  title: string
  description: string
  category: string
  frequency: string
  status: string
  created_at: string
  created_by: string
  questions_count?: number
  completions_count?: number
}

export default function CheckSheetsPage() {
  const [checkSheets, setCheckSheets] = useState<CheckSheet[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const [newCheckSheet, setNewCheckSheet] = useState({
    title: "",
    description: "",
    category: "",
    frequency: "Weekly",
    status: "Draft",
  })

  useEffect(() => {
    fetchCheckSheets()
  }, [])

  const fetchCheckSheets = async () => {
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from("check_sheet_templates")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Get question and completion counts for each check sheet
      const checkSheetsWithCounts = await Promise.all(
        (data || []).map(async (checkSheet) => {
          const [{ count: questionsCount }, { count: completionsCount }] = await Promise.all([
            supabase
              .from("check_sheet_questions")
              .select("*", { count: "exact", head: true })
              .eq("template_id", checkSheet.id),
            supabase
              .from("check_sheet_completions")
              .select("*", { count: "exact", head: true })
              .eq("template_id", checkSheet.id),
          ])

          return {
            ...checkSheet,
            questions_count: questionsCount || 0,
            completions_count: completionsCount || 0,
          }
        }),
      )

      setCheckSheets(checkSheetsWithCounts)
    } catch (error) {
      console.error("Error fetching check sheets:", error)
      toast.error("Failed to load check sheets")
    } finally {
      setLoading(false)
    }
  }

  const handleAddCheckSheet = async () => {
    const supabase = createClient()
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const { error } = await supabase.from("check_sheet_templates").insert([
        {
          ...newCheckSheet,
          created_by: user.id,
        },
      ])

      if (error) throw error

      toast.success("Check sheet template created successfully")
      setIsAddDialogOpen(false)
      setNewCheckSheet({
        title: "",
        description: "",
        category: "",
        frequency: "Weekly",
        status: "Draft",
      })
      fetchCheckSheets()
    } catch (error) {
      console.error("Error adding check sheet:", error)
      toast.error("Failed to create check sheet template")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800"
      case "draft":
        return "bg-yellow-100 text-yellow-800"
      case "archived":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getFrequencyColor = (frequency: string) => {
    switch (frequency.toLowerCase()) {
      case "daily":
        return "bg-red-100 text-red-800"
      case "weekly":
        return "bg-blue-100 text-blue-800"
      case "monthly":
        return "bg-green-100 text-green-800"
      case "quarterly":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const filteredCheckSheets = checkSheets.filter((checkSheet) => {
    const matchesSearch =
      checkSheet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkSheet.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      checkSheet.category?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || checkSheet.status.toLowerCase() === statusFilter.toLowerCase()

    return matchesSearch && matchesStatus
  })

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
            <h2 className="text-3xl font-bold text-foreground">Check Sheets Management</h2>
            <p className="text-muted-foreground mt-2">Create and manage inspection and quality check sheet templates</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Check Sheet Template</DialogTitle>
                <DialogDescription>Create a new check sheet template for quality inspections.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newCheckSheet.title}
                    onChange={(e) => setNewCheckSheet({ ...newCheckSheet, title: e.target.value })}
                    placeholder="e.g., Daily Equipment Inspection"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={newCheckSheet.category}
                    onChange={(e) => setNewCheckSheet({ ...newCheckSheet, category: e.target.value })}
                    placeholder="e.g., Safety, Quality, Maintenance"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <Select
                    value={newCheckSheet.frequency}
                    onValueChange={(value) => setNewCheckSheet({ ...newCheckSheet, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Daily">Daily</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Quarterly">Quarterly</SelectItem>
                      <SelectItem value="As Needed">As Needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCheckSheet.description}
                    onChange={(e) => setNewCheckSheet({ ...newCheckSheet, description: e.target.value })}
                    placeholder="Describe the purpose and scope of this check sheet..."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCheckSheet}>Create Template</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search check sheets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
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

        {/* Check Sheets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCheckSheets.map((checkSheet) => (
            <Card key={checkSheet.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{checkSheet.title}</CardTitle>
                    <CardDescription>{checkSheet.category}</CardDescription>
                  </div>
                  <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(checkSheet.status)}>{checkSheet.status}</Badge>
                    <Badge className={getFrequencyColor(checkSheet.frequency)}>{checkSheet.frequency}</Badge>
                  </div>

                  {checkSheet.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{checkSheet.description}</p>
                  )}

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>{checkSheet.questions_count} questions</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{checkSheet.completions_count} completed</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      Edit Template
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                      View Results
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCheckSheets.length === 0 && (
          <div className="text-center py-12">
            <ClipboardCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No check sheets found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Create your first check sheet template to get started."}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
