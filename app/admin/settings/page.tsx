"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Settings, Save } from "lucide-react"

export default function AdminSettingsPage() {
  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">System Settings</h2>
            <p className="text-muted-foreground mt-2">Configure system settings and preferences</p>
          </div>
          <Button>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>Configure global system settings and preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">System settings functionality will be available in a future update.</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
