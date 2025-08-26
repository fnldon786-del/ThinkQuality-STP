"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { SOPForm } from "@/components/sop-form"

export default function CreateSOPPage() {
  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Create SOP</h2>
          <p className="text-muted-foreground mt-2">Create a new Standard Operating Procedure</p>
        </div>

        <SOPForm />
      </div>
    </DashboardLayout>
  )
}
