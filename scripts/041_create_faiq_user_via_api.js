// Create Faiq admin user using the existing API endpoint
// This ensures proper user creation with all necessary auth and profile records

const createFaiqUser = async () => {
  try {
    console.log("[v0] Creating Faiq admin user...")

    const userData = {
      username: "Faiq",
      first_name: "Faiq",
      last_name: "Donnelly",
      password: "fnl786",
      role: "Admin",
    }

    console.log("[v0] User data:", userData)

    const response = await fetch("/api/create-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    })

    const result = await response.json()

    if (response.ok) {
      console.log("[v0] Faiq user created successfully:", result)
      console.log("[v0] You can now login with username: Faiq, password: fnl786")
    } else {
      console.error("[v0] Failed to create Faiq user:", result)
      if (result.error === "already_exists") {
        console.log("[v0] Faiq user already exists, you can try logging in")
      }
    }
  } catch (error) {
    console.error("[v0] Error creating Faiq user:", error)
  }
}

// Execute the function
createFaiqUser()
