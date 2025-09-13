import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfilePosts } from "@/components/profile/profile-posts"
import { ProfileStats } from "@/components/profile/profile-stats"

interface ProfilePageProps {
  params: {
    username: string
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = await createClient()

  // Get the profile data
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(`
      *,
      posts(count),
      followers:follows!follows_following_id_fkey(count),
      following:follows!follows_follower_id_fkey(count)
    `)
    .eq("username", params.username)
    .single()

  if (error || !profile) {
    notFound()
  }

  // Get current user to check if viewing own profile
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isOwnProfile = user?.id === profile.id

  // Get posts for this profile
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles(username, full_name, avatar_url),
      likes(count),
      comments(count)
    `)
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProfileHeader profile={profile} isOwnProfile={isOwnProfile} currentUserId={user?.id} />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <ProfileStats profile={profile} />
          </div>

          <div className="lg:col-span-2">
            <ProfilePosts posts={posts || []} isOwnProfile={isOwnProfile} />
          </div>
        </div>
      </div>
    </div>
  )
}
