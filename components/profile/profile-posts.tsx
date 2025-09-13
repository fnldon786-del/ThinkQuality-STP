import { Card, CardContent } from "@/components/ui/card"
import { PostCard } from "@/components/posts/post-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface ProfilePostsProps {
  posts: any[]
  isOwnProfile: boolean
}

export function ProfilePosts({ posts, isOwnProfile }: ProfilePostsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Posts</h2>
        {isOwnProfile && (
          <Link href="/create-post">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">
              {isOwnProfile ? "You haven't posted anything yet." : "No posts yet."}
            </p>
            {isOwnProfile && (
              <Link href="/create-post">
                <Button className="mt-4">Create your first post</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
