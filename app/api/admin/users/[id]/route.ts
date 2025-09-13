import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("[v0] User update API called for ID:", params.id)

  try {
    const supabase = await createClient()

    // Check if current user is authenticated and is a Super Admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Authentication failed:", authError?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the current user is a Super Admin
    const { data: currentUserProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || currentUserProfile?.role !== "Super Admin") {
      console.log("[v0] User is not Super Admin:", currentUserProfile?.role)
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const body = await request.json()
    console.log("[v0] Update request body:", body)

    const { username, first_name, last_name, role } = body

    // Validate required fields
    if (!username || !first_name || !last_name || !role) {
      console.log("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if username already exists for a different user
    const { data: existingUser, error: checkError } = await supabase
      .from("profiles")
      .select("username, id")
      .eq("username", username)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      console.log("[v0] Error checking username:", checkError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingUser && existingUser.id !== params.id) {
      console.log("[v0] Username already exists for different user:", username)
      return NextResponse.json({ error: "Username already exists" }, { status: 400 })
    }

    // Update the user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        username: username,
        first_name: first_name,
        last_name: last_name,
        role: role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single()

    if (updateError) {
      console.log("[v0] Profile update failed:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    console.log("[v0] User updated successfully:", updatedProfile)
    return NextResponse.json({
      success: true,
      user: updatedProfile,
      message: "User updated successfully",
    })
  } catch (error) {
    console.log("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  console.log("[v0] User deletion API called for ID:", params.id)

  try {
    const supabase = await createClient()

    // Check if current user is authenticated and is a Super Admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("[v0] Authentication failed:", authError?.message)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify the current user is a Super Admin
    const { data: currentUserProfile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profileError || currentUserProfile?.role !== "Super Admin") {
      console.log("[v0] User is not Super Admin:", currentUserProfile?.role)
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Prevent self-deletion
    if (params.id === user.id) {
      console.log("[v0] User trying to delete themselves")
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Delete the auth user (this will cascade to profile due to foreign key)
    const { error: deleteError } = await supabase.auth.admin.deleteUser(params.id)

    if (deleteError) {
      console.log("[v0] Auth user deletion failed:", deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    console.log("[v0] User deleted successfully")
    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.log("[v0] Unexpected error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
