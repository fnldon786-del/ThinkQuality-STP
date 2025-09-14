"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
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

  let supabase: any = null
  try {
    if (
      typeof window !== "undefined" &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      console.log("[v0] Supabase client initialized successfully")
    } else {
      console.log("[v0] Supabase environment variables missing")
      setError("Database connection unavailable. Please check your connection and try again.")
    }
  } catch (err) {
    console.error("[v0] Supabase client initialization error:", err)
    setError("Database connection unavailable. Please check your connection and try again.")
  }

  useEffect(() => {
    console.log("[v0] Login page mounting...")
    try {
      setMounted(true)
      console.log("[v0] Login page mounted successfully")
    } catch (err) {
      console.error("[v0] Error during mount:", err)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Login form submitted with username:", username)
    setIsLoading(true)
    setError(null)

    try {
      if (!supabase) {
        throw new Error("Database connection not available. Please check your connection and try again.")
      }

      console.log("[v0] User login attempt for:", username)

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
        email: `${username}@internal.thinkquality.app`,
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

  if (!mounted) {
    console.log("[v0] Component not mounted yet, showing loading...")
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  console.log("[v0] Rendering login page")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <Logo size="xl" showText={false} />
            </div>
            <div>
              <CardDescription className="text-gray-600">Sign in to your account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">{error}</p>
              </div>
            )}

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
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <span>Powered by ThinkQuality</span>
      </div>
    </div>
  )
}
