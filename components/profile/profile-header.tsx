"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, LinkIcon, Calendar, Edit } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface ProfileHeaderProps {
  profile: any
  isOwnProfile: boolean
  currentUserId?: string
}

export function ProfileHeader({ profile, isOwnProfile, currentUserId }: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleFollow = async () => {
    if (!currentUserId) return

    setIsLoading(true)
    try {
      if (isFollowing) {
        await supabase.from("follows").delete().eq("follower_id", currentUserId).eq("following_id", profile.id)
      } else {
        await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: profile.id,
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

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <Avatar className="w-32 h-32">
              <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt={profile.full_name} />
              <AvatarFallback className="text-2xl">
                {profile.full_name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("") || profile.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.role && (
                  <Badge variant="secondary" className="mt-2">
                    {profile.role}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2">
                {isOwnProfile ? (
                  <Link href="/profile/edit">
                    <Button variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </Link>
                ) : (
                  <Button onClick={handleFollow} disabled={isLoading} variant={isFollowing ? "outline" : "default"}>
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}
              </div>
            </div>

            {profile.bio && <p className="text-sm leading-relaxed">{profile.bio}</p>}

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </div>
              )}
              {profile.website && (
                <div className="flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" />
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {profile.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Joined{" "}
                {new Date(profile.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
