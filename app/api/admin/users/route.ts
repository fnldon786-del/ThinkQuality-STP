import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[v0] User creation API called")

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Authentication failed:", authError?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: currentUserProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || currentUserProfile?.role !== "Admin") {
      console.log("[v0] User is not Admin:", currentUserProfile?.role)
      return NextResponse.json({ error: "Insufficient permissions - Admin role required" }, { status: 403 })
    }

    const body = await request.json()
    console.log("[v0] Request body:", body)

    const { username, first_name, last_name, password, role, company_id } = body

    // Validate required fields
    if (!username || !first_name || !last_name || !password || !role) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      console.log("[v0] Password too short")
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if username already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.log("[v0] Error checking username:", checkError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingUser) {
      console.log("[v0] Username already exists:", username)
      return NextResponse.json({ error: "Username already exists" }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    const internalEmail = `${username.toLowerCase()}@internal.thinkquality.app`

    console.log("[v0] Creating auth user with email:", internalEmail)

    const { data: authData, error: createError } = await adminSupabase.auth.admin.createUser({
      email: internalEmail,
      password: password,
      user_metadata: {
        username: username,
        first_name: first_name,
        last_name: last_name,
        role: role,
      },
      email_confirm: true, // Skip email confirmation for admin-created users
    })

    if (createError) {
      console.log("[v0] Auth user creation failed:", createError)
      if (createError.message.includes("already registered")) {
        return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
      }
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    if (!authData.user) {
      console.log("[v0] No user data returned from auth creation")
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    console.log("[v0] Auth user created successfully:", authData.user.id)

    try {
      const { data: manualProfile, error: manualProfileError } = await adminSupabase
        .from("profiles")
        .insert({
          id: authData.user.id,
          username: username,
          first_name: first_name,
          last_name: last_name,
          role: role,
          email: internalEmail,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (manualProfileError) {
        console.log("[v0] Manual profile creation failed:", manualProfileError)
        // Clean up the auth user if profile creation fails
        console.log("[v0] Cleaning up auth user due to profile creation failure")
        await adminSupabase.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json(
          { error: `Failed to create user profile: ${manualProfileError.message}` },
          { status: 500 },
        )
      }

      console.log("[v0] Profile created successfully:", manualProfile)
      return NextResponse.json({
        success: true,
        user: manualProfile,
        message: `User ${first_name} ${last_name} created successfully`,
      })
    } catch (profileError) {
      console.log("[v0] Profile creation exception:", profileError)
      // Clean up the auth user if profile creation fails
      console.log("[v0] Cleaning up auth user due to profile creation exception")
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
    }
  } catch (error) {
    console.log("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  console.log("[v0] Get users API called")

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: currentUserProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || currentUserProfile?.role !== "Admin") {
      return NextResponse.json({ error: "Insufficient permissions - Admin role required" }, { status: 403 })
    }

    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })

    if (usersError) {
      console.log("[v0] Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({ users })
  } catch (error) {
    console.log("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
