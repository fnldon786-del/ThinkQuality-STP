import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (email !== "admin@stp.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const supabase = createAdminClient()

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error("Auth creation error:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create the profile with SuperAdmin role
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: authData.user.id,
      email: authData.user.email,
      role: "SuperAdmin",
      full_name: "Super Administrator",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("Profile creation error:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Super admin created successfully",
      userId: authData.user.id,
    })
  } catch (error) {
    console.error("Super admin creation error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
