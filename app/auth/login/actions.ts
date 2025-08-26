"use server"

import { createAdminClient } from "@/lib/supabase/server"

export async function createSuperAdminUser() {
  try {
    console.log("[v0] Server: Creating super admin user...")

    const supabase = createAdminClient()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@stp.com",
      password: "12345678",
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes("already registered")) {
        console.log("[v0] Server: User already exists, that's fine")
        return { success: true, message: "User already exists" }
      }
      console.error("[v0] Server: Auth creation error:", authError)
      return { success: false, error: authError.message }
    }

    console.log("[v0] Server: Auth user created:", authData.user.id)

    try {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: authData.user.email,
        role: "SuperAdmin",
        full_name: "Super Administrator",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.log("[v0] Server: Profile creation failed (table might not exist):", profileError.message)
        // Don't fail the entire process if profile creation fails
      } else {
        console.log("[v0] Server: Profile created successfully")
      }
    } catch (profileError) {
      console.log("[v0] Server: Profile creation failed, but auth user exists")
    }

    console.log("[v0] Server: Super admin setup completed")
    return { success: true, userId: authData.user.id }
  } catch (error) {
    console.error("[v0] Server: Super admin creation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
