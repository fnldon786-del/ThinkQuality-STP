"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { SOPList } from "@/components/sop-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

export default function AdminSOPsPage() {
  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Standard Operating Procedures</h2>
        </div>

        <div className="flex justify-end gap-3 pb-4 border-b">
          <Button asChild>
            <Link href="/admin/sops/create">
              <Plus className="h-4 w-4 mr-2" />
              Create SOP
            </Link>
          </Button>
        </div>

        <SOPList userRole="Admin" showCreateButton={true} />
      </div>
    </DashboardLayout>
  )
}
