"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AnalyticsChart } from "@/components/analytics-chart"
import { MetricsCard } from "@/components/metrics-card"
import { createClient } from "@/lib/supabase/client"
import { BarChart3, TrendingUp, Users, CheckCircle, AlertTriangle, FileText } from "lucide-react"
import { addDays } from "date-fns"

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  })
  const [reportType, setReportType] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDatabaseAvailable, setIsDatabaseAvailable] = useState(true)
  const [metrics, setMetrics] = useState({
    totalJobCards: 0,
    completedJobCards: 0,
    totalSOPs: 0,
    completedCheckSheets: 0,
    reportedFaults: 0,
    activeUsers: 0,
  })
  const [chartData, setChartData] = useState({
    jobCardTrends: [],
    sopUsage: [],
    checkSheetCompliance: [],
    faultTrends: [],
  })

  const [supabase, setSupabase] = useState<any>(null)

  useEffect(() => {
    try {
      const client = createClient()
      setSupabase(client)
      console.log("[v0] Supabase client initialized successfully")
    } catch (error) {
      console.error("[v0] Failed to initialize Supabase client:", error)
      setError("Failed to initialize database connection")
      setIsDatabaseAvailable(false)
    }
  }, [])

  useEffect(() => {
    if (supabase) {
      fetchAnalyticsData()
    }
  }, [dateRange, reportType, supabase])

  const fetchAnalyticsData = async () => {
    if (!supabase) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Fetching analytics data...")

      const queryTimeout = (promise: Promise<any>, timeoutMs = 10000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error("Query timeout")), timeoutMs)),
        ])
      }

      const safeQuery = async (tableName: string, query: any) => {
        try {
          const result = await queryTimeout(query)
          return result
        } catch (error: any) {
          console.warn(`[v0] Failed to query ${tableName}:`, error.message)
          if (
            error.message?.includes("Could not find the table") ||
            error.code === "PGRST205" ||
            error.message?.includes("Failed to fetch")
          ) {
            setIsDatabaseAvailable(false)
          }
          return { data: [], count: 0, error: error.message }
        }
      }

      const [jobCardsResult, sopsResult, checkSheetsResult, faultsResult, usersResult] = await Promise.all([
        safeQuery("job_cards", supabase.from("job_cards").select("*", { count: "exact" })),
        safeQuery("sops", supabase.from("sops").select("*", { count: "exact" })),
        safeQuery("completed_check_sheets", supabase.from("completed_check_sheets").select("*", { count: "exact" })),
        safeQuery("faults", supabase.from("faults").select("*", { count: "exact" })),
        safeQuery("profiles", supabase.from("profiles").select("*", { count: "exact" })),
      ])

      const completedJobCards = await safeQuery(
        "job_cards_completed",
        supabase.from("job_cards").select("*", { count: "exact" }).eq("status", "completed"),
      )

      if (!isDatabaseAvailable) {
        setMetrics({
          totalJobCards: 12,
          completedJobCards: 8,
          totalSOPs: 15,
          completedCheckSheets: 25,
          reportedFaults: 3,
          activeUsers: 5,
        })

        setChartData({
          jobCardTrends: [
            { month: "Jan", count: 10 },
            { month: "Feb", count: 15 },
            { month: "Mar", count: 12 },
          ],
          sopUsage: [
            { category: "Maintenance", total_sops: 8 },
            { category: "Safety", total_sops: 5 },
            { category: "Quality", total_sops: 2 },
          ],
          checkSheetCompliance: [
            { week: "Week 1", approval_rate: 85 },
            { week: "Week 2", approval_rate: 92 },
            { week: "Week 3", approval_rate: 88 },
          ],
          faultTrends: [
            { month: "Jan", fault_count: 5 },
            { month: "Feb", fault_count: 3 },
            { month: "Mar", fault_count: 2 },
          ],
        })

        setError("Database schema not set up. Showing sample data. Please run database scripts to enable live data.")
        console.log("[v0] Using fallback sample data")
        return
      }

      setMetrics({
        totalJobCards: jobCardsResult.count || 0,
        completedJobCards: completedJobCards.count || 0,
        totalSOPs: sopsResult.count || 0,
        completedCheckSheets: checkSheetsResult.count || 0,
        reportedFaults: faultsResult.count || 0,
        activeUsers: usersResult.count || 0,
      })

      const [jobTrendsResult, sopUsageResult, complianceResult, faultTrendsResult] = await Promise.all([
        safeQuery("job_card_analytics", supabase.from("job_card_analytics").select("*")),
        safeQuery("sop_usage_analytics", supabase.from("sop_usage_analytics").select("*")),
        safeQuery("check_sheet_compliance", supabase.from("check_sheet_compliance").select("*")),
        safeQuery("fault_trends", supabase.from("fault_trends").select("*")),
      ])

      setChartData({
        jobCardTrends: jobTrendsResult.data || [],
        sopUsage: sopUsageResult.data || [],
        checkSheetCompliance: complianceResult.data || [],
        faultTrends: faultTrendsResult.data || [],
      })

      console.log("[v0] Analytics data fetched successfully")
    } catch (error: any) {
      console.error("[v0] Error fetching analytics data:", error)
      setError(`Failed to load analytics data: ${error.message}`)
      setIsDatabaseAvailable(false)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    console.log("Exporting report...", { dateRange, reportType })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="job-cards">Job Cards</SelectItem>
              <SelectItem value="sops">SOPs</SelectItem>
              <SelectItem value="check-sheets">Check Sheets</SelectItem>
              <SelectItem value="faults">Faults</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricsCard
          title="Total Job Cards"
          value={metrics.totalJobCards}
          icon={<FileText className="h-4 w-4 text-blue-600" />}
          trend="up"
          change={12}
          changeLabel="from last month"
        />
        <MetricsCard
          title="Completed Job Cards"
          value={metrics.completedJobCards}
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          trend="up"
          change={8}
          changeLabel="completion rate"
        />
        <MetricsCard
          title="Active SOPs"
          value={metrics.totalSOPs}
          icon={<FileText className="h-4 w-4 text-purple-600" />}
          trend="neutral"
        />
        <MetricsCard
          title="Check Sheets Completed"
          value={metrics.completedCheckSheets}
          icon={<CheckCircle className="h-4 w-4 text-blue-600" />}
          trend="up"
          change={15}
          changeLabel="this month"
        />
        <MetricsCard
          title="Reported Faults"
          value={metrics.reportedFaults}
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          trend="down"
          change={-5}
          changeLabel="from last month"
        />
        <MetricsCard
          title="Active Users"
          value={metrics.activeUsers}
          icon={<Users className="h-4 w-4 text-green-600" />}
          trend="up"
          change={3}
          changeLabel="new this month"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          title="Job Card Trends"
          description="Monthly job card completion trends"
          data={chartData.jobCardTrends}
          type="line"
          dataKey="count"
          xAxisKey="month"
        />
        <AnalyticsChart
          title="SOP Usage by Category"
          description="Distribution of SOPs across categories"
          data={chartData.sopUsage}
          type="pie"
          dataKey="total_sops"
          xAxisKey="category"
        />
        <AnalyticsChart
          title="Check Sheet Compliance"
          description="Weekly compliance rates"
          data={chartData.checkSheetCompliance}
          type="bar"
          dataKey="approval_rate"
          xAxisKey="week"
        />
        <AnalyticsChart
          title="Fault Trends by Severity"
          description="Monthly fault reports by severity level"
          data={chartData.faultTrends}
          type="bar"
          dataKey="fault_count"
          xAxisKey="month"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detailed Reports</CardTitle>
          <CardDescription>Generate comprehensive reports for specific time periods and categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
              <BarChart3 className="h-6 w-6 mb-2" />
              Performance Report
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
              <TrendingUp className="h-6 w-6 mb-2" />
              Trend Analysis
            </Button>
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center bg-transparent">
              <Users className="h-6 w-6 mb-2" />
              User Activity Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
