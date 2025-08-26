"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showDashboardSelection, setShowDashboardSelection] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    console.log("[v0] Login page mounting...")
    setMounted(true)
    console.log("[v0] Login page mounted successfully")
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Login form submitted with username:", username)
    setIsLoading(true)
    setError(null)

    try {
      if (username === "Stpadmin" && password === "12345678") {
        console.log("[v0] Super admin login attempt")

        let { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: "admin@stp.com",
          password: "12345678",
        })

        if (signInError && signInError.message.includes("Invalid login credentials")) {
          console.log("[v0] Super admin user doesn't exist, creating...")

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: "admin@stp.com",
            password: "12345678",
            options: {
              emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
            },
          })

          if (signUpError) {
            console.error("[v0] Sign up error:", signUpError)
            throw signUpError
          }

          if (signUpData.user) {
            console.log("[v0] Creating super admin profile...")
            const { error: profileError } = await supabase.from("profiles").insert({
              id: signUpData.user.id,
              username: "Stpadmin",
              role: "SuperAdmin",
              full_name: "Super Administrator",
              company_name: "STP Engineering",
              email: "admin@stp.com",
            })

            if (profileError) {
              console.log("[v0] Profile creation error:", profileError)
            }
          }

          // Try signing in again
          const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
            email: "admin@stp.com",
            password: "12345678",
          })

          if (retryError) {
            console.error("[v0] Retry sign in error:", retryError)
            throw retryError
          }
          signInData = retrySignIn
        } else if (signInError) {
          console.error("[v0] Sign in error:", signInError)
          throw signInError
        }

        console.log("[v0] Super admin login successful")
        setShowDashboardSelection(true)
        setIsLoading(false)
        return
      }

      console.log("[v0] Regular user login attempt for:", username)

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single()

      if (profileError || !profiles) {
        console.error("[v0] Profile lookup error:", profileError)
        throw new Error("Invalid username or password")
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: profiles.email || `${username}@company.com`,
        password: password,
      })

      if (authError) {
        console.error("[v0] Auth error:", authError)
        throw new Error("Invalid username or password")
      }

      console.log("[v0] Login successful, redirecting based on role:", profiles.role)

      switch (profiles.role) {
        case "Admin":
          router.push("/admin")
          break
        case "Technician":
          router.push("/technician")
          break
        case "Customer":
          router.push("/customer")
          break
        default:
          router.push("/admin")
      }
    } catch (err: any) {
      console.error("[v0] Login error:", err)
      setError(err.message || "Login failed. Please try again.")
      setIsLoading(false)
    }
  }

  const handleDashboardSelection = (dashboard: string) => {
    console.log("[v0] Super admin selected dashboard:", dashboard)
    router.push(`/${dashboard}`)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (showDashboardSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl">
            <CardHeader className="text-center space-y-4">
              <Logo size="lg" showText={false} />
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">Select Dashboard</CardTitle>
                <CardDescription className="text-gray-600">Choose which dashboard to access</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => handleDashboardSelection("admin")}
                className="w-full h-12 text-left justify-start"
                variant="outline"
              >
                <div>
                  <div className="font-medium">Admin Dashboard</div>
                  <div className="text-sm text-muted-foreground">Manage users, settings, and system overview</div>
                </div>
              </Button>

              <Button
                onClick={() => handleDashboardSelection("technician")}
                className="w-full h-12 text-left justify-start"
                variant="outline"
              >
                <div>
                  <div className="font-medium">Technician Dashboard</div>
                  <div className="text-sm text-muted-foreground">Job cards, SOPs, and maintenance tasks</div>
                </div>
              </Button>

              <Button
                onClick={() => handleDashboardSelection("customer")}
                className="w-full h-12 text-left justify-start"
                variant="outline"
              >
                <div>
                  <div className="font-medium">Customer Dashboard</div>
                  <div className="text-sm text-muted-foreground">Service requests and reports</div>
                </div>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <span>Powered by ThinkQuality</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <Logo size="lg" showText={false} />
            <div>
              <CardDescription className="text-gray-600">Sign in to your account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Don't have an account? </span>
              <Link href="/auth/sign-up" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-md text-xs text-gray-600">
              <p className="font-medium mb-1">Super Admin Login:</p>
              <p>
                Username: <span className="font-mono">Stpadmin</span>
              </p>
              <p>
                Password: <span className="font-mono">12345678</span>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <span>Powered by ThinkQuality</span>
      </div>
    </div>
  )
}
