"use server"

import { createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function createSuperAdmin() {
  const supabase = createAdminClient()

  try {
    console.log("[v0] Starting super admin creation...")

    // First check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error("[v0] Error listing users:", listError)
      redirect("/auth/login?error=setup_failed")
      return
    }

    const existingUser = existingUsers.users.find((user) => user.email === "admin@stp.com")

    if (existingUser) {
      console.log("[v0] User already exists, updating profile...")

      // Update the profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: existingUser.id,
        email: "admin@stp.com",
        full_name: "Super Administrator",
        role: "SuperAdmin",
        company_name: "STP",
        phone: "+1234567890",
      })

      if (profileError) {
        console.error("[v0] Profile update error:", profileError)
      }

      redirect("/auth/login?message=Super admin account ready (existing user updated)")
      return
    }

    // Create the auth user
    console.log("[v0] Creating new auth user...")
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: "admin@stp.com",
      password: "12345678",
      email_confirm: true,
      user_metadata: {
        full_name: "Super Administrator",
        role: "SuperAdmin",
      },
    })

    if (authError) {
      console.error("[v0] Auth error:", authError)
      redirect("/auth/login?error=auth_creation_failed")
      return
    }

    console.log("[v0] Auth user created, creating profile...")

    // Create the profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authData.user.id,
      email: "admin@stp.com",
      full_name: "Super Administrator",
      role: "SuperAdmin",
      company_name: "STP",
      phone: "+1234567890",
    })

    if (profileError) {
      console.error("[v0] Profile error:", profileError)
      redirect("/auth/login?error=profile_creation_failed")
      return
    }

    console.log("[v0] Super admin created successfully")
    redirect("/auth/login?message=Super admin account created successfully")
  } catch (error) {
    console.error("[v0] Unexpected error creating super admin:", error)
    redirect("/auth/login?error=unexpected_error")
  }
}
