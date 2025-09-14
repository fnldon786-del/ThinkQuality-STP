import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

async function authenticateUser(request: NextRequest) {
  // First check for demo session
  const cookieStore = await cookies()
  const demoSessionCookie = cookieStore.get("demo-session")

  if (demoSessionCookie) {
    try {
      const demoSession = JSON.parse(decodeURIComponent(demoSessionCookie.value))
      if (demoSession.user && demoSession.expires_at > Date.now()) {
        console.log("[v0] API: Demo user authenticated:", demoSession.user.role)
        return { user: demoSession.user, isDemo: true }
      }
    } catch (error) {
      console.log("[v0] API: Demo session parse error:", error)
    }
  }

  // Fall back to Supabase authentication
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { user: null, isDemo: false, error: authError }
  }

  // Get user profile for Supabase users
  const { data: currentUserProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("username", user.email?.split("@")[0] || "")
    .single()

  if (profileError) {
    return { user: null, isDemo: false, error: profileError }
  }

  return { user: { ...user, role: currentUserProfile.role }, isDemo: false }
}

export async function POST(request: NextRequest) {
  console.log("[v0] User creation API called")

  try {
    const authResult = await authenticateUser(request)

    if (!authResult.user) {
      console.log("[v0] Authentication failed:", authResult.error?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (authResult.user.role !== "Admin") {
      console.log("[v0] User is not Admin:", authResult.user.role)
      return NextResponse.json({ error: "Insufficient permissions - Admin role required" }, { status: 403 })
    }

    if (authResult.isDemo) {
      const body = await request.json()
      console.log("[v0] Demo user creation request:", body)

      // Simulate user creation for demo
      const mockUser = {
        username: body.username,
        first_name: body.first_name,
        last_name: body.last_name,
        role: body.role,
        cellphone: body.cellphone || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        user: mockUser,
        message: `Demo: User ${body.first_name} ${body.last_name} created successfully`,
      })
    }

    const body = await request.json()
    console.log("[v0] Request body:", body)

    const { username, first_name, last_name, password, role, cellphone } = body

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

    const supabase = await createClient() // Declare supabase variable here

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
          username: username,
          first_name: first_name,
          last_name: last_name,
          role: role,
          cellphone: cellphone || "",
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
    const authResult = await authenticateUser(request)

    if (!authResult.user) {
      console.log("[v0] Authentication failed:", authResult.error?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (authResult.user.role !== "Admin") {
      console.log("[v0] User is not Admin:", authResult.user.role)
      return NextResponse.json({ error: "Insufficient permissions - Admin role required" }, { status: 403 })
    }

    if (authResult.isDemo) {
      console.log("[v0] Returning demo users data")
      const mockUsers = [
        {
          id: "1",
          username: "admin",
          first_name: "Admin",
          last_name: "User",
          role: "Admin",
          cellphone: "555-0001",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          username: "technician",
          first_name: "Tech",
          last_name: "User",
          role: "Technician",
          cellphone: "555-0002",
          created_at: "2024-01-02T00:00:00Z",
          updated_at: "2024-01-02T00:00:00Z",
        },
        {
          id: "3",
          username: "manager",
          first_name: "Manager",
          last_name: "User",
          role: "Manager",
          cellphone: "555-0003",
          created_at: "2024-01-03T00:00:00Z",
          updated_at: "2024-01-03T00:00:00Z",
        },
      ]

      return NextResponse.json({ users: mockUsers })
    }

    const supabase = await createClient()

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
