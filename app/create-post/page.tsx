import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CreatePostForm } from "@/components/posts/create-post-form"

export default async function CreatePostPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Create New Post</h1>
        <CreatePostForm userId={user.id} />
      </div>
    </div>
  )
}
