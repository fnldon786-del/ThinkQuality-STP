import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProfileStatsProps {
  profile: any
}

export function ProfileStats({ profile }: ProfileStatsProps) {
  const stats = [
    {
      label: "Posts",
      value: profile.posts?.[0]?.count || 0,
    },
    {
      label: "Followers",
      value: profile.followers?.[0]?.count || 0,
    },
    {
      label: "Following",
      value: profile.following?.[0]?.count || 0,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stats</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex justify-between items-center">
              <span className="text-muted-foreground">{stat.label}</span>
              <span className="font-semibold">{stat.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
