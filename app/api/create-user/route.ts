import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, first_name, last_name, password, role, email: providedEmail } = body

    if (!username || !first_name || !last_name || !password || !role) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const email = providedEmail
      ? String(providedEmail).toLowerCase()
      : `${String(username).toLowerCase()}@thinkquality.internal`

    // Admin client (service role) - this function in lib/supabase/server returns a server client
    const supabase = createAdminClient()

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { username, first_name, last_name },
      email_confirm: true,
    })

    if (authError) {
      // return the auth error message so admin UI can show it
      return NextResponse.json({ error: "auth_error", message: authError.message }, { status: 400 })
    }

    const userId = authData.user?.id
    if (!userId) {
      return NextResponse.json({ error: "no_user", message: "No user returned from auth creation" }, { status: 500 })
    }

    const profileData = {
      id: userId,
      username,
      first_name,
      last_name,
      email,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: profileResult, error: profileError } = await supabase.from("profiles").insert(profileData).select()

    if (profileError) {
      try {
        await supabase.auth.admin.deleteUser(userId)
      } catch (cleanupErr) {
        // ignore cleanup errors, but log them in server logs
        console.error("[create-user] cleanup deleteUser error:", cleanupErr)
      }
      return NextResponse.json({ error: "db_error", message: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "User created successfully", userId })
  } catch (err) {
    console.error("[create-user] Unexpected error:", err)
    return NextResponse.json(
      { error: "server_error", message: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 },
    )
  }
}
