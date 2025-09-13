"use client"

import { PostCard } from "./post-card"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"

interface PostFeedProps {
  posts: any[]
  currentUserId?: string
  showCreateButton?: boolean
}

export function PostFeed({ posts, currentUserId, showCreateButton = true }: PostFeedProps) {
  return (
    <div className="space-y-6">
      {showCreateButton && currentUserId && (
        <Card>
          <CardContent className="p-4">
            <Link href="/create-post">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                What's on your mind?
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No posts yet. Be the first to share something!</p>
            {currentUserId && (
              <Link href="/create-post">
                <Button className="mt-4">Create your first post</Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
