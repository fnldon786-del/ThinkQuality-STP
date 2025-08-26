"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { JobCardList } from "@/components/job-card-list"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"

export default function TechnicianJobCardsPage() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase])

  if (!user) {
    return (
      <DashboardLayout role="Technician">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Technician">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">My Job Cards</h2>
            <p className="text-muted-foreground mt-2">Manage your assigned maintenance work</p>
          </div>
          <Button asChild>
            <Link href="/technician/job-cards/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Job Card
            </Link>
          </Button>
        </div>

        <JobCardList userRole="Technician" userId={user.id} />
      </div>
    </DashboardLayout>
  )
}
