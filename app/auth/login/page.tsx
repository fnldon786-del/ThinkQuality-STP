"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!username || !password) throw new Error("Please enter your credentials")

      const demoUsers = {
        admin: { password: "admin123!", role: "Admin", email: "admin@thinkquality.com" },
        technician: { password: "tech123!", role: "Technician", email: "technician@thinkquality.com" },
        customer: { password: "customer123!", role: "Customer", email: "customer@thinkquality.com" },
      }

      const userKey = username.toLowerCase()
      const demoUser = demoUsers[userKey as keyof typeof demoUsers]

      console.log("[v0] Demo login attempt with:", userKey)
      console.log("[v0] Demo user found:", !!demoUser)
      console.log("[v0] Password match:", demoUser?.password === password)

      if (!demoUser || demoUser.password !== password) {
        throw new Error("Invalid username or password")
      }

      console.log("[v0] Demo authentication successful for role:", demoUser.role)

      const demoSession = {
        user: {
          id: `demo-${userKey}`,
          email: demoUser.email,
          username: userKey,
          role: demoUser.role,
        },
        expires_at: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      }

      localStorage.setItem("demo-session", JSON.stringify(demoSession))

      const cookieValue = encodeURIComponent(JSON.stringify(demoSession))
      document.cookie = `demo-session=${cookieValue}; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`

      console.log("[v0] Demo session created")

      // Redirect based on role
      console.log("[v0] Redirecting based on role:", demoUser.role)
      switch (demoUser.role) {
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
          setError("Your account role is not configured correctly. Please contact support.")
          return
      }
    } catch (err: any) {
      console.error("[v0] Login error:", err.message)
      setError(err?.message || "Login failed. Please try again.")
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
            <div className="flex justify-center">
              <Logo size="xl" showText={false} />
            </div>
            <div>
              <CardDescription className="text-gray-600">Sign in to your account</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800 font-medium mb-2">Demo Credentials:</p>
              <div className="text-xs text-blue-700 space-y-1">
                <div>
                  <strong>Admin:</strong> admin / admin123!
                </div>
                <div>
                  <strong>Technician:</strong> technician / tech123!
                </div>
                <div>
                  <strong>Customer:</strong> customer / customer123!
                </div>
              </div>
            </div>

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
