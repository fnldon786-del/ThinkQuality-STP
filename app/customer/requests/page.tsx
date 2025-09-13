"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { Search, Plus, Eye } from "lucide-react"
import Link from "next/link"
import type { User } from "@supabase/supabase-js"

interface CustomerRequest {
  id: string
  request_number: string
  title: string
  description: string
  priority: string
  status: string
  request_type: string
  created_at: string
  machine?: {
    name: string
    machine_id: string
  }
}

export default function CustomerRequestsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<CustomerRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<CustomerRequest[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        loadRequests(user.id)
      }
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    filterRequests()
  }, [requests, searchTerm])

  const loadRequests = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("customer_requests")
        .select(`
          *,
          machine:machine_id(name, machine_id)
        `)
        .eq("requested_by", userId)
        .order("created_at", { ascending: false })

      if (error) {
        if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
          console.log("[v0] Customer requests table not found, using empty data")
          setRequests([])
        } else {
          throw error
        }
      } else {
        setRequests(data || [])
      }
    } catch (error) {
      console.error("Error loading requests:", error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const filterRequests = () => {
    let filtered = requests

    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.request_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.description.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredRequests(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "bg-blue-100 text-blue-800"
      case "Under Review":
        return "bg-yellow-100 text-yellow-800"
      case "Approved":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-purple-100 text-purple-800"
      case "Completed":
        return "bg-green-100 text-green-800"
      case "Rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Urgent":
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

  if (!user || loading) {
    return (
      <DashboardLayout role="Customer">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Customer">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">My Service Requests</h2>
            <p className="text-muted-foreground mt-2">Track your maintenance and service requests</p>
          </div>
          <Button asChild>
            <Link href="/customer/requests/create">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              {requests.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground">No service requests found</p>
                  <p className="text-sm text-muted-foreground">Create your first service request to get started</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No requests found matching your search.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{request.title}</CardTitle>
                      <CardDescription>
                        {request.request_number} • {request.request_type}
                        {request.machine && ` • ${request.machine.name}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>
                      <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground line-clamp-2">{request.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
