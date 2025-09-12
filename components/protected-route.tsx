"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

interface Profile {
  role: string
  email: string
}

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setUser(user)

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("id", user.id)
          .single()

        if (profileError) {
          if (user.email === "admin@stp.com") {
            setProfile({ role: "SuperAdmin", email: user.email })
            setLoading(false)
            return
          }

          router.push("/auth/login")
          return
        }

        if (!profile) {
          router.push("/auth/login")
          return
        }

        setProfile(profile)

        const isSuperUser = profile.role === "SuperAdmin" || profile.email === "admin@stp.com"

        // Check if user has required role or is super user
        if (!allowedRoles.includes(profile.role) && !isSuperUser) {
          // Redirect to appropriate dashboard based on role
          const redirectPath =
            profile.role === "Admin" ? "/admin" : profile.role === "Customer" ? "/customer" : "/technician"
          router.push(redirectPath)
          return
        }

        setLoading(false)
      } catch (error) {
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [supabase, router, allowedRoles])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return <>{children}</>
}
