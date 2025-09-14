"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"

interface Profile {
  role: string
  cellphone: string
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

      const checkDemoSession = () => {
        try {
          console.log("[v0] ProtectedRoute: All cookies:", document.cookie)

          const demoSessionCookie = document.cookie.split("; ").find((row) => row.startsWith("demo-session="))

          console.log("[v0] ProtectedRoute: Demo session cookie found:", !!demoSessionCookie)

          if (demoSessionCookie) {
            const cookieValue = demoSessionCookie.split("=")[1]
            console.log("[v0] ProtectedRoute: Raw cookie value:", cookieValue)

            const decodedValue = decodeURIComponent(cookieValue)
            console.log("[v0] ProtectedRoute: Decoded cookie value:", decodedValue)

            const demoSession = JSON.parse(decodedValue)

            console.log("[v0] ProtectedRoute: Demo session found:", demoSession)

            if (demoSession.user && demoSession.user.username && demoSession.user.role) {
              const demoProfile: Profile = {
                role: demoSession.user.role,
                cellphone: demoSession.user.cellphone || "",
                username: demoSession.user.username,
              }

              console.log("[v0] ProtectedRoute: Demo role check:", {
                userRole: demoProfile.role,
                allowedRoles,
                hasAccess: allowedRoles.includes(demoProfile.role),
              })

              if (!allowedRoles.includes(demoProfile.role)) {
                console.log("[v0] ProtectedRoute: Demo access denied, redirecting to appropriate dashboard")
                const redirectPath =
                  demoProfile.role === "Admin"
                    ? "/admin"
                    : demoProfile.role === "Customer"
                      ? "/customer"
                      : "/technician"
                router.push(redirectPath)
                return false
              }

              console.log("[v0] ProtectedRoute: Demo access granted")
              setProfile(demoProfile)
              setLoading(false)
              return true
            }
          }
        } catch (error) {
          console.log("[v0] ProtectedRoute: Demo session parse error:", error)
        }
        return false
      }

      if (checkDemoSession()) {
        return
      }

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
        console.log("[v0] ProtectedRoute: Looking up profile for user:", user.email)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role, cellphone, username")
          .eq("username", user.email?.split("@")[0] || "")
          .single()

        console.log("[v0] ProtectedRoute: Profile lookup result:", { profile, error: profileError })

        if (profileError) {
          console.log("[v0] ProtectedRoute: Profile error:", profileError.message)
          router.push("/auth/login")
          return
        }

        if (!profile) {
          console.log("[v0] ProtectedRoute: No profile data returned")
          router.push("/auth/login")
          return
        }

        setProfile(profile)

        console.log("[v0] ProtectedRoute: Role check:", {
          userRole: profile.role,
          allowedRoles,
          hasAccess: allowedRoles.includes(profile.role),
        })

        if (!allowedRoles.includes(profile.role)) {
          console.log("[v0] ProtectedRoute: Access denied, redirecting to appropriate dashboard")
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
