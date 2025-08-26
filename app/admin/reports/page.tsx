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

  const supabase = createClient()

  useEffect(() => {
    fetchAnalyticsData()
  }, [dateRange, reportType])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Fetch metrics
      const [jobCardsResult, sopsResult, checkSheetsResult, faultsResult, usersResult] = await Promise.all([
        supabase.from("job_cards").select("*", { count: "exact" }),
        supabase.from("sops").select("*", { count: "exact" }),
        supabase.from("completed_check_sheets").select("*", { count: "exact" }),
        supabase.from("faults").select("*", { count: "exact" }),
        supabase.from("profiles").select("*", { count: "exact" }),
      ])

      const completedJobCards = await supabase
        .from("job_cards")
        .select("*", { count: "exact" })
        .eq("status", "completed")

      setMetrics({
        totalJobCards: jobCardsResult.count || 0,
        completedJobCards: completedJobCards.count || 0,
        totalSOPs: sopsResult.count || 0,
        completedCheckSheets: checkSheetsResult.count || 0,
        reportedFaults: faultsResult.count || 0,
        activeUsers: usersResult.count || 0,
      })

      // Fetch chart data
      const [jobTrendsResult, sopUsageResult, complianceResult, faultTrendsResult] = await Promise.all([
        supabase.from("job_card_analytics").select("*"),
        supabase.from("sop_usage_analytics").select("*"),
        supabase.from("check_sheet_compliance").select("*"),
        supabase.from("fault_trends").select("*"),
      ])

      setChartData({
        jobCardTrends: jobTrendsResult.data || [],
        sopUsage: sopUsageResult.data || [],
        checkSheetCompliance: complianceResult.data || [],
        faultTrends: faultTrendsResult.data || [],
      })
    } catch (error) {
      console.error("Error fetching analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async () => {
    // Implementation for exporting reports
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Business insights and performance metrics</p>
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

      {/* Key Metrics */}
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

      {/* Charts */}
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

      {/* Detailed Reports */}
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
