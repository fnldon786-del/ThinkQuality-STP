import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileEditForm } from "@/components/profile/profile-edit-form"

export default async function EditProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Edit Profile</h1>
        <ProfileEditForm profile={profile} />
      </div>
    </div>
  )
}
