import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { username, first_name, last_name, email, password, role } = await request.json()

    // Validate required fields
    if (!username || !first_name || !last_name || !email || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create the user in Supabase Auth using admin client
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation for admin-created users
    })

    if (authError) {
      console.error("Auth creation error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

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
      console.error("Profile creation error:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "User created successfully",
      userId: authData.user.id,
    })
  } catch (error) {
    console.error("User creation error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
