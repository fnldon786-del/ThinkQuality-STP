"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { CheckSheetList } from "@/components/check-sheet-list"

export default function TechnicianCheckSheetsPage() {
  return (
    <DashboardLayout role="Technician">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Check Sheets</h2>
          <p className="text-muted-foreground mt-2">Complete inspection and quality check sheets</p>
        </div>

        <CheckSheetList userRole="Technician" showCreateButton={false} />
      </div>
    </DashboardLayout>
  )
}
