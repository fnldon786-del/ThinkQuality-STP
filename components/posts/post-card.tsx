"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface PostCardProps {
  post: {
    id: string
    content: string
    image_url?: string
    created_at: string
    author_id: string
    profiles: {
      username: string
      full_name: string
      avatar_url?: string
    }
    likes?: { count: number }[]
    comments?: { count: number }[]
  }
  currentUserId?: string
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(post.likes?.[0]?.count || 0)
  const [commentsCount] = useState(post.comments?.[0]?.count || 0)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleLike = async () => {
    if (!currentUserId || isLoading) return

    setIsLoading(true)
    try {
      if (isLiked) {
        await supabase.from("likes").delete().eq("user_id", currentUserId).eq("post_id", post.id)
        setLikesCount((prev) => prev - 1)
      } else {
        await supabase.from("likes").insert({
          user_id: currentUserId,
          post_id: post.id,
        })
        setLikesCount((prev) => prev + 1)
      }
      setIsLiked(!isLiked)
    } catch (error) {
      console.error("Error liking post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!currentUserId || currentUserId !== post.author_id) return

    try {
      await supabase.from("posts").delete().eq("id", post.id)
      router.refresh()
    } catch (error) {
      console.error("Error deleting post:", error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/profile/${post.profiles.username}`}>
              <Avatar className="w-10 h-10 cursor-pointer">
                <AvatarImage src={post.profiles.avatar_url || "/placeholder.svg"} alt={post.profiles.full_name} />
                <AvatarFallback>
                  {post.profiles.full_name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("") || post.profiles.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/profile/${post.profiles.username}`} className="hover:underline">
                <p className="font-semibold text-sm">{post.profiles.full_name || post.profiles.username}</p>
              </Link>
              <p className="text-xs text-muted-foreground">@{post.profiles.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{formatDate(post.created_at)}</span>
            {currentUserId === post.author_id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    Delete Post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

          {post.image_url && (
            <div className="rounded-lg overflow-hidden">
              <img
                src={post.image_url || "/placeholder.svg"}
                alt="Post image"
                className="w-full h-auto object-cover max-h-96"
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                disabled={!currentUserId || isLoading}
                className={`gap-2 ${isLiked ? "text-red-500" : ""}`}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                <span className="text-xs">{likesCount}</span>
              </Button>

              <Button variant="ghost" size="sm" className="gap-2">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{commentsCount}</span>
              </Button>
            </div>

            <Button variant="ghost" size="sm">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
