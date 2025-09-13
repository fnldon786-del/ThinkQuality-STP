"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { FaultSearch } from "@/components/fault-search"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function TechnicianFaultsPage() {
  return (
    <DashboardLayout role="Technician">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Fault Database</h2>
            <p className="text-muted-foreground mt-2">Search and report equipment faults</p>
          </div>
          <Button asChild>
            <Link href="/technician/faults/report">
              <Plus className="h-4 w-4 mr-2" />
              Report Fault
            </Link>
          </Button>
        </div>

        <FaultSearch userRole="Technician" showCreateButton={true} />
      </div>
    </DashboardLayout>
  )
}
