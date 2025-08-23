"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Shield, Wrench, Eye, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import Link from "next/link"

interface SOP {
  id: string
  sop_number: string
  title: string
  description: string
  version: string
  status: string
  estimated_time_minutes: number
  difficulty_level: string
  equipment_types: string[]
  safety_requirements: string[]
  required_tools: string[]
  effective_date: string
  created_at: string
  category: {
    name: string
    color: string
  }
  creator: {
    full_name: string
  }
}

interface SOPListProps {
  userRole: string
  showCreateButton?: boolean
}

export function SOPList({ userRole, showCreateButton = false }: SOPListProps) {
  const [sops, setSops] = useState<SOP[]>([])
  const [filteredSops, setFilteredSops] = useState<SOP[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [difficultyFilter, setDifficultyFilter] = useState("all")
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadSOPs()
    loadCategories()
  }, [])

  useEffect(() => {
    filterSOPs()
  }, [sops, searchTerm, statusFilter, categoryFilter, difficultyFilter])

  const loadSOPs = async () => {
    setIsLoading(true)

    const { data, error } = await supabase
      .from("sops")
      .select(
        `
        *,
        category:category_id(name, color),
        creator:created_by(full_name)
      `,
      )
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error loading SOPs:", error)
    } else {
      setSops(data || [])
    }

    setIsLoading(false)
  }

  const loadCategories = async () => {
    const { data } = await supabase.from("sop_categories").select("id, name").order("name")
    if (data) {
      setCategories(data)
    }
  }

  const filterSOPs = () => {
    let filtered = sops

    if (searchTerm) {
      filtered = filtered.filter(
        (sop) =>
          sop.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sop.sop_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sop.equipment_types?.some((eq) => eq.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((sop) => sop.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((sop) => sop.category?.name === categoryFilter)
    }

    if (difficultyFilter !== "all") {
      filtered = filtered.filter((sop) => sop.difficulty_level === difficultyFilter)
    }

    setFilteredSops(filtered)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800"
      case "Under Review":
        return "bg-yellow-100 text-yellow-800"
      case "Draft":
        return "bg-gray-100 text-gray-800"
      case "Archived":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
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
              <Input placeholder="Search SOPs..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* SOPs Grid */}
      {filteredSops.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No SOPs found matching your criteria.</p>
            {showCreateButton && (
              <Button asChild className="mt-4">
                <Link href="/admin/sops/create">Create First SOP</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSops.map((sop) => (
            <Card key={sop.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{sop.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{sop.sop_number}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <Badge className={getStatusColor(sop.status)}>{sop.status}</Badge>
                    <Badge className={getDifficultyColor(sop.difficulty_level)}>{sop.difficulty_level}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {sop.description && <p className="text-sm text-muted-foreground line-clamp-2">{sop.description}</p>}

                <div className="space-y-2 text-sm">
                  {sop.category && (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sop.category.color }}></div>
                      <span>{sop.category.name}</span>
                    </div>
                  )}

                  {sop.estimated_time_minutes && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{sop.estimated_time_minutes} minutes</span>
                    </div>
                  )}

                  {sop.equipment_types && sop.equipment_types.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-muted-foreground" />
                      <span>{sop.equipment_types.slice(0, 2).join(", ")}</span>
                      {sop.equipment_types.length > 2 && <span>+{sop.equipment_types.length - 2} more</span>}
                    </div>
                  )}

                  {sop.safety_requirements && sop.safety_requirements.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      <span className="text-red-600">{sop.safety_requirements.length} safety requirements</span>
                    </div>
                  )}

                  {sop.effective_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Effective {format(new Date(sop.effective_date), "MMM d, yyyy")}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Button asChild size="sm" className="w-full">
                    <Link href={`/${userRole.toLowerCase()}/sops/${sop.id}`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View SOP
                    </Link>
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
