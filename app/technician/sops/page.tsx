"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { SOPList } from "@/components/sop-list"

export default function TechnicianSOPsPage() {
  return (
    <DashboardLayout role="Technician">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">SOPs Library</h2>
          <p className="text-muted-foreground mt-2">Access approved Standard Operating Procedures</p>
        </div>

        <SOPList userRole="Technician" />
      </div>
    </DashboardLayout>
  )
}
