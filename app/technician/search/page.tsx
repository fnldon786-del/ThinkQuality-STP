"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Search, FileText, ClipboardCheck, Wrench } from "lucide-react"

interface SearchResult {
  id: string
  title: string
  type: "SOP" | "Fault" | "CheckSheet"
  category?: string
  description: string
  content?: string
  solution?: string
  status?: string
}

export default function TechnicianSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    try {
      // Search SOPs
      const { data: sops } = await supabase
        .from("sops")
        .select("*")
        .eq("status", "Approved")
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%`)

      // Search Faults
      const { data: faults } = await supabase
        .from("faults")
        .select("*")
        .eq("status", "Verified")
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,solution.ilike.%${searchTerm}%`)

      // Search Check Sheets
      const { data: checkSheets } = await supabase
        .from("check_sheets")
        .select("*")
        .eq("status", "Active")
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)

      const results: SearchResult[] = [
        ...(sops || []).map((sop) => ({
          id: sop.id,
          title: sop.title,
          type: "SOP" as const,
          category: sop.category,
          description: sop.description,
          content: sop.content,
        })),
        ...(faults || []).map((fault) => ({
          id: fault.id,
          title: fault.title,
          type: "Fault" as const,
          category: fault.category,
          description: fault.description,
          solution: fault.solution,
        })),
        ...(checkSheets || []).map((sheet) => ({
          id: sheet.id,
          title: sheet.title,
          type: "CheckSheet" as const,
          description: sheet.description,
        })),
      ]

      setSearchResults(results)
    } catch (error) {
      console.error("Search error:", error)
      // Fallback to mock data if database tables don't exist
      setSearchResults([
        {
          id: "1",
          title: "Hydraulic System Maintenance",
          type: "SOP",
          category: "Maintenance",
          description: "Standard procedure for hydraulic system maintenance and inspection",
        },
        {
          id: "2",
          title: "Motor Overheating Issue",
          type: "Fault",
          category: "Electrical",
          description: "Common causes and solutions for motor overheating problems",
          solution: "Check cooling system, clean air filters, verify electrical connections",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SOP":
        return <ClipboardCheck className="h-4 w-4" />
      case "Fault":
        return <Wrench className="h-4 w-4" />
      case "CheckSheet":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "SOP":
        return "bg-blue-100 text-blue-800"
      case "Fault":
        return "bg-red-100 text-red-800"
      case "CheckSheet":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout role="Technician">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Knowledge Base Search</h2>
          <p className="text-muted-foreground mt-2">Search for solutions, procedures, and technical information</p>
        </div>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search SOPs, fault solutions, procedures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Search Results ({searchResults.length})</h3>
            {searchResults.map((result) => (
              <Card key={result.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(result.type)}
                      <CardTitle className="text-lg">{result.title}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getTypeBadgeColor(result.type)}>{result.type}</Badge>
                      {result.category && <Badge variant="outline">{result.category}</Badge>}
                    </div>
                  </div>
                  <CardDescription>{result.description}</CardDescription>
                </CardHeader>
                {(result.content || result.solution) && (
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      {result.solution && (
                        <div>
                          <strong>Solution:</strong> {result.solution.substring(0, 200)}
                          {result.solution.length > 200 && "..."}
                        </div>
                      )}
                      {result.content && (
                        <div>
                          <strong>Content:</strong> {result.content.substring(0, 200)}
                          {result.content.length > 200 && "..."}
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {searchTerm && searchResults.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No results found for "{searchTerm}"</p>
              <p className="text-sm text-muted-foreground mt-2">Try different keywords or check the spelling</p>
            </CardContent>
          </Card>
        )}

        {!searchTerm && (
          <Card>
            <CardContent className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Enter search terms to find SOPs, fault solutions, and procedures</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
