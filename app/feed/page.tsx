import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PostFeed } from "@/components/posts/post-feed"
import { UserSuggestions } from "@/components/social/user-suggestions"

export default async function FeedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get posts from users the current user follows
  const { data: followingPosts } = await supabase
    .from("posts")
    .select(`
      *,
      profiles(username, full_name, avatar_url),
      likes(count),
      comments(count)
    `)
    .in("author_id", supabase.from("follows").select("following_id").eq("follower_id", user.id))
    .order("created_at", { ascending: false })
    .limit(20)

  // If no following posts, show all posts
  const { data: allPosts } =
    followingPosts?.length === 0
      ? await supabase
          .from("posts")
          .select(`
          *,
          profiles(username, full_name, avatar_url),
          likes(count),
          comments(count)
        `)
          .order("created_at", { ascending: false })
          .limit(20)
      : { data: null }

  const posts = followingPosts?.length > 0 ? followingPosts : allPosts

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2">
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">Your Feed</h1>
                <p className="text-muted-foreground">
                  {followingPosts?.length > 0
                    ? "Posts from people you follow"
                    : "Discover new posts from the community"}
                </p>
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
