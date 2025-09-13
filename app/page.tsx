import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PostFeed } from "@/components/posts/post-feed"
import { UserSuggestions } from "@/components/social/user-suggestions"

export default async function HomePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get posts from users the current user follows, plus their own posts
  const { data: posts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles(username, full_name, avatar_url),
      likes(count),
      comments(count)
    `)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">Home Feed</h1>
                <p className="text-muted-foreground">Stay connected with your community</p>
              </div>
              <PostFeed posts={posts || []} currentUserId={user.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <UserSuggestions currentUserId={user.id} />
          </div>
        </div>
      </div>
    </div>
  )
}
