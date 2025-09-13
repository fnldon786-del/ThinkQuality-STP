import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { Navigation } from "./navigation"

interface AppLayoutProps {
  children: React.ReactNode
}

export async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let profile = null
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("id", user.id)
      .single()
    profile = data
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} profile={profile} />
      <main>{children}</main>
    </div>
  )
}
