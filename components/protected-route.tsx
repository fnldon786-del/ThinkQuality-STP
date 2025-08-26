"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

interface Profile {
  role: string
  email: string
  username: string
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
      console.log("[v0] ProtectedRoute: Starting auth check")

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      console.log("[v0] ProtectedRoute: User check result:", { user: user?.email, error: userError })

      if (!user) {
        console.log("[v0] ProtectedRoute: No user found, redirecting to login")
        router.push("/auth/login")
        return
      }

      setUser(user)

      try {
        console.log("[v0] ProtectedRoute: Looking up profile for user:", user.id)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, email, username")
          .eq("id", user.id)
          .single()

        console.log("[v0] ProtectedRoute: Profile lookup result:", { profile, error: profileError })

        if (profileError) {
          console.log("[v0] ProtectedRoute: Profile error:", profileError.message)

          // Special handling for super admin when profiles table doesn't exist
          if (user.email === "admin@stp.com" && profileError.code === "PGRST205") {
            console.log("[v0] ProtectedRoute: Super admin detected, allowing access despite missing profiles table")
            // Create a temporary profile for super admin
            const tempProfile: Profile = {
              role: "SuperAdmin",
              email: user.email,
              username: "Stpadmin",
            }
            setProfile(tempProfile)
            setLoading(false)
            return
          }

          router.push("/auth/login")
          return
        }

        if (!profile) {
          console.log("[v0] ProtectedRoute: No profile data returned")
          router.push("/auth/login")
          return
        }

        setProfile(profile)

        const isSuperAdmin = profile.role === "SuperAdmin"
        console.log("[v0] ProtectedRoute: Role check:", {
          userRole: profile.role,
          allowedRoles,
          isSuperAdmin,
          hasAccess: allowedRoles.includes(profile.role) || isSuperAdmin,
        })

        // Check if user has required role or is super admin
        if (!allowedRoles.includes(profile.role) && !isSuperAdmin) {
          console.log("[v0] ProtectedRoute: Access denied, redirecting to appropriate dashboard")
          // Redirect to appropriate dashboard based on role
          const redirectPath =
            profile.role === "Admin" ? "/admin" : profile.role === "Customer" ? "/customer" : "/technician"
          router.push(redirectPath)
          return
        }

        console.log("[v0] ProtectedRoute: Access granted")
        setLoading(false)
      } catch (error) {
        console.log("[v0] ProtectedRoute: Unexpected error:", error)
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
