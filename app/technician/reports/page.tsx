"use client"

import { useState, useEffect } from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricsCard } from "@/components/metrics-card"
import { AnalyticsChart } from "@/components/analytics-chart"
import { createClient } from "@/lib/supabase/client"
import { CheckCircle, Clock, FileText } from "lucide-react"

export default function TechnicianReportsPage() {
  const [loading, setLoading] = useState(true)
  const [personalMetrics, setPersonalMetrics] = useState({
    assignedJobCards: 0,
    completedJobCards: 0,
    completedCheckSheets: 0,
    reportedFaults: 0,
    avgCompletionTime: 0,
  })
  const [chartData, setChartData] = useState({
    monthlyCompletion: [],
    taskDistribution: [],
  })

  const supabase = createClient()

  useEffect(() => {
    fetchPersonalMetrics()
  }, [])

  const fetchPersonalMetrics = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Fetch personal metrics
      const [assignedResult, completedResult, checkSheetsResult, faultsResult] = await Promise.all([
        supabase.from("job_cards").select("*", { count: "exact" }).eq("assigned_to", user.id),
        supabase.from("job_cards").select("*", { count: "exact" }).eq("assigned_to", user.id).eq("status", "completed"),
        supabase.from("completed_check_sheets").select("*", { count: "exact" }).eq("completed_by", user.id),
        supabase.from("faults").select("*", { count: "exact" }).eq("reported_by", user.id),
      ])

      setPersonalMetrics({
        assignedJobCards: assignedResult.count || 0,
        completedJobCards: completedResult.count || 0,
        completedCheckSheets: checkSheetsResult.count || 0,
        reportedFaults: faultsResult.count || 0,
        avgCompletionTime: 4.2, // Mock data - would be calculated from actual completion times
      })

      // Mock chart data - in real implementation, this would come from database
      setChartData({
        monthlyCompletion: [
          { month: "Jan", completed: 12 },
          { month: "Feb", completed: 15 },
          { month: "Mar", completed: 18 },
          { month: "Apr", completed: 14 },
          { month: "May", completed: 20 },
        ],
        taskDistribution: [
          { name: "Job Cards", value: completedResult.count || 0 },
          { name: "Check Sheets", value: checkSheetsResult.count || 0 },
          { name: "Fault Reports", value: faultsResult.count || 0 },
        ],
      })
    } catch (error) {
      console.error("Error fetching personal metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading your metrics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
        <p className="text-gray-600">Your personal productivity metrics and achievements</p>
      </div>

      {/* Personal Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricsCard
          title="Assigned Job Cards"
          value={personalMetrics.assignedJobCards}
          icon={<FileText className="h-4 w-4 text-blue-600" />}
        />
        <MetricsCard
          title="Completed Job Cards"
          value={personalMetrics.completedJobCards}
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          trend="up"
          change={12}
          changeLabel="this month"
        />
        <MetricsCard
          title="Check Sheets Done"
          value={personalMetrics.completedCheckSheets}
          icon={<CheckCircle className="h-4 w-4 text-purple-600" />}
          trend="up"
          change={8}
          changeLabel="this month"
        />
        <MetricsCard
          title="Avg. Completion Time"
          value={`${personalMetrics.avgCompletionTime}h`}
          icon={<Clock className="h-4 w-4 text-orange-600" />}
          trend="down"
          change={-15}
          changeLabel="improvement"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsChart
          title="Monthly Completion Trend"
          description="Your job completion over the last 5 months"
          data={chartData.monthlyCompletion}
          type="line"
          dataKey="completed"
          xAxisKey="month"
        />
        <AnalyticsChart
          title="Task Distribution"
          description="Breakdown of your completed tasks"
          data={chartData.taskDistribution}
          type="pie"
          dataKey="value"
          xAxisKey="name"
        />
      </div>

      {/* Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Quality Champion</CardTitle>
            <CardDescription className="text-green-600">100% check sheet approval rate this month</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">Speed Demon</CardTitle>
            <CardDescription className="text-blue-600">15% faster than average completion time</CardDescription>
          </CardHeader>
        </Card>
        <Card className="border-purple-200 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800">Problem Solver</CardTitle>
            <CardDescription className="text-purple-600">Reported 5 critical faults this month</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
