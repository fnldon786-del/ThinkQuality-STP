"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { CheckSheetTemplateForm } from "@/components/check-sheet-template-form"

export default function CreateCheckSheetPage() {
  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Create Check Sheet Template</h2>
          <p className="text-muted-foreground mt-2">Create a new inspection or quality check sheet template</p>
        </div>

        <CheckSheetTemplateForm />
      </div>
    </DashboardLayout>
  )
}
