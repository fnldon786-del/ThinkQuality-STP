"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { FaultSearch } from "@/components/fault-search"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function AdminFaultsPage() {
  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Fault & Fix Database</h2>
        </div>

        <div className="flex justify-end gap-3 pb-4 border-b">
          <Button asChild>
            <Link href="/admin/faults/create">
              <Plus className="h-4 w-4 mr-2" />
              Add Fault Solution
            </Link>
          </Button>
        </div>

        <FaultSearch userRole="Admin" showCreateButton={true} />
      </div>
    </DashboardLayout>
  )
}
