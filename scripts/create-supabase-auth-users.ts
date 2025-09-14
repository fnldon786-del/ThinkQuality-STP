import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAuthUsers() {
  console.log("[v0] Creating Supabase auth users...")

  const users = [
    {
      email: "admin@thinkquality.com",
      password: "admin123!",
      username: "admin",
      role: "Admin",
      firstName: "System",
      lastName: "Administrator",
    },
    {
      email: "technician@thinkquality.com",
      password: "tech123!",
      username: "technician",
      role: "Technician",
      firstName: "Tech",
      lastName: "User",
    },
    {
      email: "customer@thinkquality.com",
      password: "customer123!",
      username: "customer",
      role: "Customer",
      firstName: "Customer",
      lastName: "User",
    },
  ]

  for (const user of users) {
    try {
      console.log(`[v0] Creating auth user: ${user.email}`)

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          username: user.username,
          first_name: user.firstName,
          last_name: user.lastName,
          role: user.role,
        },
      })

      if (authError) {
        console.error(`[v0] Auth error for ${user.email}:`, authError.message)
        continue
      }

      console.log(`[v0] Auth user created: ${authData.user.id}`)

      // Create profile
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: user.email,
        username: user.username,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error(`[v0] Profile error for ${user.email}:`, profileError.message)
      } else {
        console.log(`[v0] Profile created for: ${user.email}`)
      }
    } catch (error) {
      console.error(`[v0] Error creating user ${user.email}:`, error)
    }
  }

  console.log("[v0] User creation complete!")
}

createAuthUsers()
