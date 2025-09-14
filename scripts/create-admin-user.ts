import { createAdminClient } from "../lib/supabase/server"

async function createAdminUser() {
  const supabase = createAdminClient()

  // Admin user details - modify these as needed
  const adminData = {
    username: "admin",
    first_name: "System",
    last_name: "Administrator",
    password: "admin123!", // Change this to a secure password
    role: "Admin",
    email: "admin@thinkquality.internal",
  }

  console.log("[v0] Creating admin user with username:", adminData.username)

  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminData.email,
      password: adminData.password,
      user_metadata: {
        username: adminData.username,
        first_name: adminData.first_name,
        last_name: adminData.last_name,
      },
      email_confirm: true,
    })

    if (authError) {
      console.error("[v0] Auth error:", authError.message)
      return
    }

    const userId = authData.user?.id
    if (!userId) {
      console.error("[v0] No user ID returned from auth creation")
      return
    }

    console.log("[v0] Auth user created with ID:", userId)

    // Create profile
    const profileData = {
      id: userId,
      username: adminData.username,
      first_name: adminData.first_name,
      last_name: adminData.last_name,
      email: adminData.email,
      role: adminData.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: profileResult, error: profileError } = await supabase.from("profiles").insert(profileData).select()

    if (profileError) {
      console.error("[v0] Profile creation error:", profileError.message)
      // Cleanup auth user
      try {
        await supabase.auth.admin.deleteUser(userId)
        console.log("[v0] Cleaned up auth user due to profile error")
      } catch (cleanupErr) {
        console.error("[v0] Cleanup error:", cleanupErr)
      }
      return
    }

    console.log("[v0] ✅ Admin user created successfully!")
    console.log("[v0] Username:", adminData.username)
    console.log("[v0] Email:", adminData.email)
    console.log("[v0] Role:", adminData.role)
    console.log("[v0] You can now login with these credentials")
  } catch (error) {
    console.error("[v0] Unexpected error:", error)
  }
}

// Run the script
createAdminUser()
