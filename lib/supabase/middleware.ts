import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Missing Supabase environment variables")
    // For demo purposes, allow access without Supabase if env vars are missing
    return checkDemoSession(request, supabaseResponse)
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
  })

  console.log("[v0] Middleware checking path:", request.nextUrl.pathname)

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error) {
    console.error("[v0] Supabase auth error:", error)
    // Fall back to demo session check
    return checkDemoSession(request, supabaseResponse)
  }

  let demoUser = null
  if (!user) {
    demoUser = getDemoUser(request)
  }

  console.log(
    "[v0] Middleware user check:",
    user ? `User found: ${user.email}` : demoUser ? `Demo user found: ${demoUser.username}` : "No user found",
  )

  if (
    request.nextUrl.pathname !== "/" &&
    request.nextUrl.pathname !== "/auth/login" &&
    request.nextUrl.pathname !== "/auth/sign-up" &&
    !user &&
    !demoUser &&
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

function getDemoUser(request: NextRequest) {
  const demoSessionCookie = request.cookies.get("demo-session")
  if (demoSessionCookie) {
    try {
      const decodedValue = decodeURIComponent(demoSessionCookie.value)
      const demoSession = JSON.parse(decodedValue)
      if (demoSession.expires_at > Date.now()) {
        console.log("[v0] Middleware demo user found:", demoSession.user.username, "role:", demoSession.user.role)
        return demoSession.user
      } else {
        console.log("[v0] Middleware demo session expired")
      }
    } catch (e) {
      console.log("[v0] Middleware demo session parse error:", e)
    }
  }
  return null
}

function checkDemoSession(request: NextRequest, supabaseResponse: NextResponse) {
  const demoUser = getDemoUser(request)

  if (
    request.nextUrl.pathname !== "/" &&
    request.nextUrl.pathname !== "/auth/login" &&
    request.nextUrl.pathname !== "/auth/sign-up" &&
    !demoUser &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    console.log("[v0] Middleware redirecting to login (demo mode) from:", request.nextUrl.pathname)
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  console.log("[v0] Middleware allowing access (demo mode) to:", request.nextUrl.pathname)
  return supabaseResponse
}
