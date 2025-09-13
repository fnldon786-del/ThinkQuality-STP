import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { FollowButton } from "./follow-button"
import Link from "next/link"

interface UserSuggestionsProps {
  currentUserId?: string
  limit?: number
}

export async function UserSuggestions({ currentUserId, limit = 5 }: UserSuggestionsProps) {
  const supabase = await createClient()

  // Get users that the current user is not following
  const { data: suggestions } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .neq("id", currentUserId || "")
    .limit(limit)

  if (!suggestions || suggestions.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">People you might know</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href={`/profile/${user.username}`}>
                  <Avatar className="w-10 h-10 cursor-pointer">
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} alt={user.full_name} />
                    <AvatarFallback>
                      {user.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || user.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <Link href={`/profile/${user.username}`} className="hover:underline">
                    <p className="font-semibold text-sm">{user.full_name || user.username}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <FollowButton targetUserId={user.id} currentUserId={currentUserId} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
