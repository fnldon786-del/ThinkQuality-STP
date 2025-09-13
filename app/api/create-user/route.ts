import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("[v0] Create user API called")
    const { username, first_name, last_name, email, password, role } = await request.json()

    console.log("[v0] Received user data:", { username, first_name, last_name, email, role })

    // Validate required fields
    if (!username || !first_name || !last_name || !email || !password || !role) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    console.log("[v0] Creating admin client")
    const supabase = createAdminClient()

    console.log("[v0] Creating user in Supabase Auth")
    // Create the user in Supabase Auth using admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation for admin-created users
    })

    if (authError) {
      console.error("[v0] Auth creation error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    console.log("[v0] Auth user created successfully:", authData.user.id)

    console.log("[v0] Creating profile record")
    // Create the profile with the specified role
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authData.user.id,
      username,
      first_name,
      last_name,
      email: authData.user.email,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("[v0] Profile creation error:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    console.log("[v0] User created successfully")
    return NextResponse.json({
      success: true,
      message: "User created successfully",
      userId: authData.user.id,
    })
  } catch (error) {
    console.error("[v0] User creation error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
