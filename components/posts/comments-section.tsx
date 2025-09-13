"use client"

import type React from "react"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { MessageCircle, Send } from "lucide-react"

interface Comment {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles: {
    username: string
    full_name: string
    avatar_url?: string
  }
}

interface CommentsSectionProps {
  postId: string
  currentUserId?: string
  initialCommentsCount?: number
}

export function CommentsSection({ postId, currentUserId, initialCommentsCount = 0 }: CommentsSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentsCount, setCommentsCount] = useState(initialCommentsCount)

  const supabase = createClient()

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          profiles(username, full_name, avatar_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error("Error loading comments:", error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId || isLoading) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("comments").insert({
        content: newComment.trim(),
        post_id: postId,
        user_id: currentUserId,
      })

      if (error) throw error

      setNewComment("")
      setCommentsCount((prev) => prev + 1)
      await loadComments()
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleComments = () => {
    setShowComments(!showComments)
    if (!showComments && comments.length === 0) {
      loadComments()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={toggleComments} className="gap-2">
        <MessageCircle className="w-4 h-4" />
        <span className="text-xs">{commentsCount}</span>
      </Button>

      {showComments && (
        <div className="space-y-4 pl-4 border-l-2 border-muted">
          {/* Comment Form */}
          {currentUserId && (
            <form onSubmit={handleSubmitComment} className="flex gap-3">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={2}
                  className="resize-none"
                />
                <Button type="submit" size="sm" disabled={!newComment.trim() || isLoading}>
                  <Send className="w-4 h-4 mr-2" />
                  {isLoading ? "Posting..." : "Comment"}
                </Button>
              </div>
            </form>
          )}

          {/* Comments List */}
          <div className="space-y-3">
            {comments.map((comment) => (
              <Card key={comment.id} className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage
                        src={comment.profiles.avatar_url || "/placeholder.svg"}
                        alt={comment.profiles.full_name}
                      />
                      <AvatarFallback>
                        {comment.profiles.full_name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("") || comment.profiles.username?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {comment.profiles.full_name || comment.profiles.username}
                        </span>
                        <span className="text-xs text-muted-foreground">@{comment.profiles.username}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No comments yet. Be the first to comment!</p>
          )}
        </div>
      )}
    </div>
  )
}
