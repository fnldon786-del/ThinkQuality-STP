"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Plus } from "lucide-react"

export default function AdminCompaniesPage() {
  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Company Management</h2>
        </div>

        <div className="flex gap-3 pb-4 border-b">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Management
            </CardTitle>
            <CardDescription>
              This feature is coming soon. Manage company profiles, branding, and organizational settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Company management functionality will be available in a future update.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
