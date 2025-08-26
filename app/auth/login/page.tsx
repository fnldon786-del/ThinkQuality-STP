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
    console.log("[v0] Login form submitted")
    setIsLoading(true)
    setError(null)

    try {
      if (username === "Stpadmin" && password === "12345678") {
        console.log("[v0] Super admin login attempt")

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: "admin@stp.com",
          password: "12345678",
        })

        if (signInError) {
          console.log("[v0] Super admin user doesn't exist, creating...")
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: "admin@stp.com",
            password: "12345678",
            options: {
              emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || window.location.origin,
            },
          })

          if (signUpError) {
            throw signUpError
          }

          if (signUpData.user) {
            const { error: profileError } = await supabase.from("profiles").insert({
              id: signUpData.user.id,
              username: "Stpadmin",
              role: "SuperAdmin",
              full_name: "Super Administrator",
              company_name: "STP Engineering",
            })

            if (profileError) {
              console.log("[v0] Profile creation error:", profileError)
            }
          }

          const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
            email: "admin@stp.com",
            password: "12345678",
          })

          if (retryError) {
            throw retryError
          }
        }

        console.log("[v0] Super admin login successful, redirecting to /admin")
        await new Promise((resolve) => setTimeout(resolve, 1000))
        router.push("/admin")
        return
      }

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single()

      if (profileError || !profiles) {
        throw new Error("Invalid username or password")
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: profiles.email || `${username}@company.com`,
        password: password,
      })

      if (authError) {
        throw new Error("Invalid username or password")
      }

      console.log("[v0] Login successful, redirecting based on role:", profiles.role)

      await new Promise((resolve) => setTimeout(resolve, 1000))

      switch (profiles.role) {
        case "Admin":
        case "SuperAdmin":
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
    } finally {
      setIsLoading(false)
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <Logo />
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">ThinkQuality</CardTitle>
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
