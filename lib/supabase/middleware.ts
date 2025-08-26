import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  console.log("[v0] Middleware checking path:", request.nextUrl.pathname)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log("[v0] Middleware user check:", user ? `User found: ${user.email}` : "No user found")

  if (
    request.nextUrl.pathname !== "/" &&
    request.nextUrl.pathname !== "/auth/login" &&
    request.nextUrl.pathname !== "/auth/sign-up" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    console.log("[v0] Middleware redirecting to login from:", request.nextUrl.pathname)
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  console.log("[v0] Middleware allowing access to:", request.nextUrl.pathname)
  return supabaseResponse
}
