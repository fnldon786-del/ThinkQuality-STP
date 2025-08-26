"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { JobCardList } from "@/components/job-card-list"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import type { User } from "@supabase/supabase-js"

export default function CustomerRequestsPage() {
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
      <DashboardLayout role="Customer">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Customer">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">My Service Requests</h2>
          <p className="text-muted-foreground mt-2">Track your maintenance and service requests</p>
        </div>

        <JobCardList userRole="Customer" userId={user.id} />
      </div>
    </DashboardLayout>
  )
}
