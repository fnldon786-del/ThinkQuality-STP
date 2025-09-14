"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

export default function CreateFaiqUser() {
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const createFaiqUser = async () => {
    try {
      setIsCreating(true)
      console.log("[v0] Creating Faiq user...")

      const userData = {
        username: "Faiq",
        first_name: "Faiq",
        last_name: "Donnelly",
        password: "12345678",
        role: "Admin",
        company_id: null, // Will be set to ThinkQuality company ID if it exists
      }

      console.log("[v0] User data:", userData)

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      const result = await response.json()
      console.log("[v0] API response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user")
      }

      toast({
        title: "Success",
        description: "Faiq user created successfully! You can now login with username 'Faiq' and password '12345678'",
      })
    } catch (error: any) {
      console.error("[v0] Error creating Faiq user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Faiq Admin User</CardTitle>
        <CardDescription>Create the Faiq admin user with the specified credentials</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm space-y-1">
            <p>
              <strong>Username:</strong> Faiq
            </p>
            <p>
              <strong>Name:</strong> Faiq Donnelly
            </p>
            <p>
              <strong>Role:</strong> Admin
            </p>
            <p>
              <strong>Company:</strong> ThinkQuality
            </p>
            <p>
              <strong>Password:</strong> 12345678
            </p>
          </div>

          <Button onClick={createFaiqUser} disabled={isCreating} className="w-full">
            {isCreating ? "Creating User..." : "Create Faiq User"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
