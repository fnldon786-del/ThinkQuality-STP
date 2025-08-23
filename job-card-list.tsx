"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, MapPin, Wrench } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import Link from "next/link"

interface JobCard {
  id: string
  job_number: string
  title: string
  description: string
  priority: string
  status: string
  equipment_name: string
  location: string
  estimated_hours: number
  due_date: string
  created_at: string
  assigned_technician?: {
    full_name: string
  }
  customer?: {
    full_name: string
  }
}

interface JobCardListProps {
  userRole: string
  userId: string
}

export function JobCardList({ userRole, userId }: JobCardListProps) {
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [filteredJobCards, setFilteredJobCards] = useState<JobCard[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadJobCards()
  }, [])

  useEffect(() => {
    filterJobCards()
  }, [jobCards, searchTerm, statusFilter, priorityFilter])

  const loadJobCards = async () => {
    setIsLoading(true)

    let query = supabase
      .from("job_cards")
      .select(
        `
        *,
        assigned_technician:assigned_to(full_name),
        customer:customer_id(full_name)
      `,
      )
      .order("created_at", { ascending: false })

    // Apply role-based filtering
    if (userRole === "Technician") {
      query = query.or(`assigned_to.eq.${userId},created_by.eq.${userId}`)
    } else if (userRole === "Customer") {
      query = query.eq("customer_id", userId)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error loading job cards:", error)
    } else {
      setJobCards(data || [])
    }

    setIsLoading(false)
  }

  const filterJobCards = () => {
    let filtered = jobCards

    if (searchTerm) {
      filtered = filtered.filter(
        (card) =>
          card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.job_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          card.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((card) => card.status === statusFilter)
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter((card) => card.priority === priorityFilter)
    }

    setFilteredJobCards(filtered)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Assigned":
        return "bg-purple-100 text-purple-800"
      case "Draft":
        return "bg-gray-100 text-gray-800"
      case "Cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search job cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Assigned">Assigned</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Job Cards Grid */}
      {filteredJobCards.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No job cards found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobCards.map((jobCard) => (
            <Card key={jobCard.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{jobCard.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{jobCard.job_number}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getPriorityColor(jobCard.priority)}>{jobCard.priority}</Badge>
                    <Badge className={getStatusColor(jobCard.status)}>{jobCard.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {jobCard.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{jobCard.description}</p>
                )}

                <div className="space-y-2 text-sm">
                  {jobCard.equipment_name && (
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span>{jobCard.equipment_name}</span>
                    </div>
                  )}
                  {jobCard.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{jobCard.location}</span>
                    </div>
                  )}
                  {jobCard.assigned_technician && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{jobCard.assigned_technician.full_name}</span>
                    </div>
                  )}
                  {jobCard.estimated_hours && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{jobCard.estimated_hours}h estimated</span>
                    </div>
                  )}
                  {jobCard.due_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Due {format(new Date(jobCard.due_date), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/${userRole.toLowerCase()}/job-cards/${jobCard.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
