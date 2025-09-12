"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Image from "next/image"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    console.log("[v0] Attempting login for username:", username)

    try {
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email, role")
        .eq("username", username)
        .single()

      console.log("[v0] Profile lookup result:", { profileData, profileError })

      if (profileError) {
        if (
          profileError.message.includes('relation "public.profiles" does not exist') ||
          profileError.message.includes("Failed to fetch")
        ) {
          throw new Error("Database not initialized. Please contact your administrator to set up the system.")
        }
        console.log("[v0] Profile not found for username:", username)
        throw new Error("Invalid username or password")
      }

      if (!profileData) {
        console.log("[v0] Profile not found for username:", username)
        throw new Error("Invalid username or password")
      }

      console.log("[v0] Found profile, attempting auth with email:", profileData.email)

      const { error } = await supabase.auth.signInWithPassword({
        email: profileData.email,
        password,
      })

      if (error) {
        console.log("[v0] Auth error:", error.message)
        throw error
      }

      console.log("[v0] Login successful, redirecting based on role:", profileData.role)

      const userRole = profileData.role
      let redirectPath = "/technician" // default

      if (userRole === "Admin" || userRole === "SuperAdmin") {
        redirectPath = "/admin"
      } else if (userRole === "Customer") {
        redirectPath = "/customer"
      }

      console.log("[v0] Redirecting to:", redirectPath)
      router.push(redirectPath)
    } catch (error: unknown) {
      console.error("[v0] Login error:", error)
      if (error instanceof Error) {
        if (error.message.includes("Invalid login credentials") || error.message.includes("Invalid username")) {
          setError("Invalid username or password. Please check your credentials.")
        } else if (error.message.includes("Database not initialized")) {
          setError("System not ready. Please contact your administrator.")
        } else {
          setError(error.message)
        }
      } else {
        setError("An error occurred during login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-20 h-20 relative">
              <Image src="/images/stp-logo.png" alt="STP Engineering" fill className="object-contain" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">ThinkQuality</CardTitle>
              <CardDescription className="text-muted-foreground">Sign in to your account</CardDescription>
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

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link href="/auth/sign-up" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
              <p className="font-medium mb-1">Admin Access:</p>
              <p>Username: Stpadmin | Password: 1234</p>
            </div>

            <div className="mt-4 pt-4 border-t text-center">
              <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                <span>Powered by</span>
                <div className="flex items-center space-x-1">
                  <div className="w-4 h-4 bg-primary rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">TQ</span>
                  </div>
                  <span className="font-semibold text-foreground">ThinkQuality</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
