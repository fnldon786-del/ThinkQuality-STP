"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { JobCardForm } from "@/components/job-card-form"

export default function CreateJobCardPage() {
  return (
    <DashboardLayout role="Technician">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Create Job Card</h2>
          <p className="text-muted-foreground mt-2">Create a new maintenance work assignment</p>
        </div>

        <JobCardForm />
      </div>
    </DashboardLayout>
  )
}
