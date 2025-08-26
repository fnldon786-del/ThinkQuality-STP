"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, FileText, ClipboardCheck, Wrench } from "lucide-react"

export default function TechnicianSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!searchTerm.trim()) return

    setLoading(true)
    // TODO: Implement actual search functionality
    setTimeout(() => {
      setSearchResults([
        {
          id: 1,
          title: "Hydraulic System Maintenance",
          type: "SOP",
          category: "Maintenance",
          description: "Standard procedure for hydraulic system maintenance and inspection",
        },
        {
          id: 2,
          title: "Motor Overheating Issue",
          type: "Fault",
          category: "Electrical",
          description: "Common causes and solutions for motor overheating problems",
        },
      ])
      setLoading(false)
    }, 1000)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SOP":
        return <ClipboardCheck className="h-4 w-4" />
      case "Fault":
        return <Wrench className="h-4 w-4" />
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
            <h3 className="text-lg font-semibold">Search Results</h3>
            {searchResults.map((result) => (
              <Card key={result.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTypeIcon(result.type)}
                      <CardTitle className="text-lg">{result.title}</CardTitle>
                    </div>
                    <Badge className={getTypeBadgeColor(result.type)}>{result.type}</Badge>
                  </div>
                  <CardDescription>{result.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">Category: {result.category}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {searchTerm && searchResults.length === 0 && !loading && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No results found for "{searchTerm}"</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
