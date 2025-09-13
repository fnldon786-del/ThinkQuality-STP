"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface FollowButtonProps {
  targetUserId: string
  currentUserId?: string
  initialIsFollowing?: boolean
}

export function FollowButton({ targetUserId, currentUserId, initialIsFollowing = false }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (currentUserId && targetUserId) {
      checkFollowStatus()
    }
  }, [currentUserId, targetUserId])

  const checkFollowStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", targetUserId)
        .single()

      if (!error && data) {
        setIsFollowing(true)
      }
    } catch (error) {
      // User is not following
      setIsFollowing(false)
    }
  }

  const handleFollow = async () => {
    if (!currentUserId || isLoading) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", targetUserId)
      } else {
        await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        })
      }
      setIsFollowing(!isFollowing)
      router.refresh()
    } catch (error) {
      console.error("Error following/unfollowing:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!currentUserId || currentUserId === targetUserId) {
    return null
  }

  return (
    <Button onClick={handleFollow} disabled={isLoading} variant={isFollowing ? "outline" : "default"}>
      {isLoading ? "..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  )
}
