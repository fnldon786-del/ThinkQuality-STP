"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, AlertTriangle, CheckCircle, Eye, Calendar } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface PendingItem {
  id: string
  title: string
  type: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  assigned_to_name: string
  estimated_completion: string | null
}

export default function CustomerPendingPage() {
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchPendingItems()
  }, [])

  const fetchPendingItems = async () => {
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
          priority,
          created_at,
          updated_at,
          estimated_completion,
          customer_company,
          profiles!job_cards_assigned_to_fkey(full_name)
        `)
        .eq("customer_company", profile.company_name)
        .in("status", ["pending", "approved", "assigned", "in_progress"])
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedItems =
        data?.map((item) => ({
          id: item.id,
          title: item.title,
          type: item.type,
          status: item.status,
          priority: item.priority,
          created_at: item.created_at,
          updated_at: item.updated_at,
          assigned_to_name: item.profiles?.full_name || "Unassigned",
          estimated_completion: item.estimated_completion,
        })) || []

      setPendingItems(formattedItems)
    } catch (error) {
      console.error("Error fetching pending items:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "assigned":
        return <AlertTriangle className="h-4 w-4 text-blue-500" />
      case "in_progress":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "assigned":
        return "bg-blue-100 text-blue-800"
      case "in_progress":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
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

  if (loading) {
    return (
      <DashboardLayout role="Customer">
        <div className="flex items-center justify-center h-64">Loading pending items...</div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Customer">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Pending Items</h2>
          <p className="text-muted-foreground mt-2">Track pending approvals and work in progress</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {pendingItems.filter((item) => item.status === "pending").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Awaiting Approval</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {pendingItems.filter((item) => item.status === "approved").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Approved</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {pendingItems.filter((item) => item.status === "assigned").length}
                  </div>
                  <div className="text-sm text-muted-foreground">Assigned</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {pendingItems.filter((item) => item.status === "in_progress").length}
                  </div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Items ({pendingItems.length})</CardTitle>
            <CardDescription>Items awaiting action or currently being worked on</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground">ID: {item.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(item.type)}>{item.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <Badge className={getStatusColor(item.status)}>{item.status.replace("_", " ")}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                    </TableCell>
                    <TableCell>{item.assigned_to_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {pendingItems.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Pending Items</h3>
              <p className="text-muted-foreground">
                All your requests have been completed or there are no active requests
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
