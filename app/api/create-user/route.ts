import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    console.log("[v0] Create user API called")
    const { username, first_name, last_name, password, role } = await request.json()

    console.log("[v0] Received user data:", { username, first_name, last_name, role })

    if (!username || !first_name || !last_name || !password || !role) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    console.log("[v0] Creating admin client")
    const supabase = createAdminClient()

    console.log("[v0] Testing admin client connection")
    const { data: testData, error: testError } = await supabase.from("profiles").select("count").limit(1)
    if (testError) {
      console.error("[v0] Admin client connection test failed:", testError)
      return NextResponse.json({ error: `Admin client connection failed: ${testError.message}` }, { status: 500 })
    }
    console.log("[v0] Admin client connection successful")

    console.log("[v0] Checking if username already exists")
    const { data: existingProfiles, error: checkError } = await supabase
      .from("profiles")
      .select("username")
      .eq("username", username)
      .limit(1)

    if (checkError) {
      console.error("[v0] Error checking existing usernames:", checkError)
    } else if (existingProfiles && existingProfiles.length > 0) {
      console.log("[v0] Username already exists:", username)
      return NextResponse.json(
        {
          error: "already_exists",
          message: `A user with username ${username} already exists. Please use a different username.`,
        },
        { status: 409 },
      )
    }

    console.log("[v0] Creating user in Supabase Auth")
    const generatedEmail = `${username}@internal.system`
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: generatedEmail,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error("[v0] Auth creation error:", authError)

      if (authError.message.includes("Password")) {
        return NextResponse.json(
          {
            error: "password_error",
            message: authError.message,
          },
          { status: 400 },
        )
      } else {
        return NextResponse.json(
          {
            error: "auth_error",
            message: authError.message,
          },
          { status: 400 },
        )
      }
    }

    if (!authData.user) {
      console.error("[v0] No user data returned from auth creation")
      return NextResponse.json({ error: "No user data returned from auth creation" }, { status: 500 })
    }

    console.log("[v0] Auth user created successfully:", authData.user.id)

    console.log("[v0] Creating profile record")
    const profileData = {
      id: authData.user.id,
      username,
      first_name,
      last_name,
      email: null,
      role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    console.log("[v0] Profile data to insert:", profileData)

    const { data: profileResult, error: profileError } = await supabase.from("profiles").insert(profileData).select()

    if (profileError) {
      console.error("[v0] Profile creation error:", profileError)
      console.error("[v0] Profile error details:", {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      })

      console.log("[v0] Cleaning up auth user due to profile creation failure")
      await supabase.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json({ error: `Profile creation failed: ${profileError.message}` }, { status: 400 })
    }

    console.log("[v0] Profile created successfully:", profileResult)
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
        error: "server_error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
