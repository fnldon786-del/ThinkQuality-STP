"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, Eye, Star } from "lucide-react"

export default function CustomerCompletedPage() {
  // Mock data - replace with actual data fetching
  const completedWork = [
    {
      id: 1,
      title: "Preventive Maintenance - Pump System",
      type: "Maintenance",
      completedDate: "2024-12-10",
      technician: "John Smith",
      rating: 5,
      description: "Completed preventive maintenance on main pump system",
    },
    {
      id: 2,
      title: "Emergency Repair - Conveyor Belt",
      type: "Repair",
      completedDate: "2024-12-08",
      technician: "Sarah Johnson",
      rating: 4,
      description: "Emergency repair completed on conveyor belt motor",
    },
  ]

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
    ))
  }

  return (
    <DashboardLayout role="Customer">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Completed Work</h2>
          <p className="text-muted-foreground mt-2">Review completed maintenance and service work</p>
        </div>

        <div className="space-y-4">
          {completedWork.map((work) => (
            <Card key={work.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <CardTitle className="text-lg">{work.title}</CardTitle>
                      <CardDescription>{work.description}</CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Completed:</span>{" "}
                      {new Date(work.completedDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Technician:</span> {work.technician}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Rating:</span>
                      <div className="flex space-x-1">{renderStars(work.rating)}</div>
                    </div>
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

        {completedWork.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No completed work to display.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
