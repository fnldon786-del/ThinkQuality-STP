"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Download, Eye } from "lucide-react"

export default function CustomerReportsPage() {
  // Mock data - replace with actual data fetching
  const reports = [
    {
      id: 1,
      title: "Monthly Maintenance Report - December 2024",
      date: "2024-12-01",
      type: "Maintenance",
      status: "completed",
      description: "Comprehensive maintenance report for all equipment",
    },
    {
      id: 2,
      title: "Hydraulic System Inspection",
      date: "2024-11-28",
      type: "Inspection",
      status: "completed",
      description: "Detailed inspection report for hydraulic systems",
    },
  ]

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <DashboardLayout role="Customer">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Service Reports</h2>
          <p className="text-muted-foreground mt-2">View completed service reports and documentation</p>
        </div>

        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusBadgeColor(report.status)}>{report.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Date:</span> {new Date(report.date).toLocaleDateString()}
                    <span className="ml-4 font-medium">Type:</span> {report.type}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {reports.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No reports available yet.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
