"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, FileText, Wrench, CheckSquare, AlertTriangle, ExternalLink, Copy } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"

interface SearchResult {
  id: string
  title: string
  content: string
  type: "sop" | "fault" | "checksheet" | "jobcard"
  category: string
  relevance: number
  created_at: string
}

interface SOP {
  id: string
  title: string
  description: string
  category: string
  content: string
}

interface Fault {
  id: string
  fault_code: string
  fault_description: string
  symptoms: string
  solution: string
  category: string
}

interface CheckSheet {
  id: string
  title: string
  description: string
  category: string
}

export default function TechnicianSearchPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setLoading(true)
    try {
      const results: SearchResult[] = []

      // Search SOPs
      const { data: sops } = await supabase
        .from("sops")
        .select("*")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,content.ilike.%${query}%`)
        .eq("status", "published")
        .limit(10)

      sops?.forEach((sop: SOP) => {
        results.push({
          id: sop.id,
          title: sop.title,
          content: sop.description,
          type: "sop",
          category: sop.category,
          relevance: calculateRelevance(query, sop.title + " " + sop.description),
          created_at: sop.created_at,
        })
      })

      // Search Faults
      const { data: faults } = await supabase
        .from("faults")
        .select("*")
        .or(
          `fault_description.ilike.%${query}%,symptoms.ilike.%${query}%,solution.ilike.%${query}%,fault_code.ilike.%${query}%`,
        )
        .eq("status", "active")
        .limit(10)

      faults?.forEach((fault: Fault) => {
        results.push({
          id: fault.id,
          title: `${fault.fault_code}: ${fault.fault_description}`,
          content: fault.symptoms,
          type: "fault",
          category: fault.category,
          relevance: calculateRelevance(query, fault.fault_description + " " + fault.symptoms),
          created_at: fault.created_at,
        })
      })

      // Search Check Sheets
      const { data: checkSheets } = await supabase
        .from("check_sheets")
        .select("*")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .eq("status", "active")
        .limit(10)

      checkSheets?.forEach((sheet: CheckSheet) => {
        results.push({
          id: sheet.id,
          title: sheet.title,
          content: sheet.description,
          type: "checksheet",
          category: sheet.category,
          relevance: calculateRelevance(query, sheet.title + " " + sheet.description),
          created_at: sheet.created_at,
        })
      })

      // Sort by relevance
      results.sort((a, b) => b.relevance - a.relevance)
      setSearchResults(results)
    } catch (error) {
      console.error("Error performing search:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateRelevance = (query: string, text: string): number => {
    const queryLower = query.toLowerCase()
    const textLower = text.toLowerCase()

    let score = 0
    if (textLower.includes(queryLower)) score += 10
    if (textLower.startsWith(queryLower)) score += 5

    const words = queryLower.split(" ")
    words.forEach((word) => {
      if (textLower.includes(word)) score += 2
    })

    return score
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "sop":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "fault":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "checksheet":
        return <CheckSquare className="h-4 w-4 text-green-500" />
      case "jobcard":
        return <Wrench className="h-4 w-4 text-orange-500" />
      default:
        return <FileText className="h-4 w-4 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "sop":
        return "bg-blue-100 text-blue-800"
      case "fault":
        return "bg-red-100 text-red-800"
      case "checksheet":
        return "bg-green-100 text-green-800"
      case "jobcard":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeLink = (result: SearchResult) => {
    switch (result.type) {
      case "sop":
        return `/technician/sops/${result.id}`
      case "fault":
        return `/technician/faults`
      case "checksheet":
        return `/technician/check-sheets/${result.id}`
      default:
        return "#"
    }
  }

  const filteredResults = searchResults.filter((result) => {
    if (activeTab === "all") return true
    return result.type === activeTab
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch(searchTerm)
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        performSearch(searchTerm)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Knowledge Base Search</h1>
          <p className="text-muted-foreground">Search SOPs, fault solutions, and check sheets</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Knowledge Base
          </CardTitle>
          <CardDescription>Find procedures, solutions, and documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search for procedures, fault codes, symptoms, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {searchTerm && (
            <div className="mt-4 text-sm text-muted-foreground">
              {loading ? "Searching..." : `Found ${searchResults.length} results for "${searchTerm}"`}
            </div>
          )}
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All ({searchResults.length})</TabsTrigger>
                <TabsTrigger value="sop">SOPs ({searchResults.filter((r) => r.type === "sop").length})</TabsTrigger>
                <TabsTrigger value="fault">
                  Faults ({searchResults.filter((r) => r.type === "fault").length})
                </TabsTrigger>
                <TabsTrigger value="checksheet">
                  Check Sheets ({searchResults.filter((r) => r.type === "checksheet").length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-6">
                {filteredResults.map((result) => (
                  <Card key={`${result.type}-${result.id}`} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getTypeIcon(result.type)}
                            <h3 className="font-semibold">{result.title}</h3>
                            <Badge className={getTypeColor(result.type)}>{result.type.toUpperCase()}</Badge>
                            <Badge variant="outline">{result.category}</Badge>
                          </div>

                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{result.content}</p>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Relevance: {result.relevance}%</span>
                            <span>Created: {new Date(result.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(result.content)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={getTypeLink(result)}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {searchTerm && !loading && searchResults.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
            <p className="text-muted-foreground">Try different keywords or check your spelling. You can search for:</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Fault codes (e.g., "F001", "hydraulic leak")</li>
              <li>• Procedure names (e.g., "startup", "maintenance")</li>
              <li>• Symptoms (e.g., "overheating", "noise")</li>
              <li>• Equipment types (e.g., "pump", "motor")</li>
            </ul>
          </CardContent>
        </Card>
      )}

      {!searchTerm && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search the Knowledge Base</h3>
            <p className="text-muted-foreground">
              Enter keywords to search across SOPs, fault solutions, and check sheets
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
