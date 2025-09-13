"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Search, UserPlus, Edit, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  username: string
  first_name: string
  last_name: string
  email: string
  role: string
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  const [newUser, setNewUser] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    role: "",
    password: "",
  })

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const fetchData = async () => {
    try {
      let usersData = []
      try {
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

        if (error) {
          if (error.code === "42P17" && error.message.includes("infinite recursion")) {
            console.log("[v0] Profiles table has policy recursion issue, using empty data")
            usersData = []
          } else if (
            error.code === "PGRST205" ||
            error.message.includes("Could not find the table") ||
            error.message.includes("schema cache")
          ) {
            console.log("[v0] Profiles table not found, using empty data")
            usersData = []
          } else {
            throw error
          }
        } else {
          usersData = data || []
        }
      } catch (tableError: any) {
        if (tableError.code === "42P17" && tableError.message.includes("infinite recursion")) {
          console.log("[v0] Profiles table has policy recursion issue, using empty data")
          usersData = []
        } else if (
          tableError.code === "PGRST205" ||
          tableError.message.includes("Could not find the table") ||
          tableError.message.includes("schema cache")
        ) {
          usersData = []
        } else {
          throw tableError
        }
      }

      setUsers(usersData)
    } catch (error) {
      console.error("Error fetching data:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch data"
      if (
        !errorMessage.includes("Could not find the table") &&
        !errorMessage.includes("schema cache") &&
        !errorMessage.includes("infinite recursion")
      ) {
        toast({
          title: "Error",
          description: "Failed to fetch data",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const createUser = async () => {
    try {
      setIsCreatingUser(true)

      const validationErrors = []
      if (!newUser.username) validationErrors.push("username")
      if (!newUser.first_name) validationErrors.push("first_name")
      if (!newUser.last_name) validationErrors.push("last_name")
      if (!newUser.email) validationErrors.push("email")
      if (!newUser.password) validationErrors.push("password")
      if (!newUser.role) validationErrors.push("role")

      if (validationErrors.length > 0) {
        toast({
          title: "Validation Error",
          description: `Please fill in all fields. Missing: ${validationErrors.join(", ")}`,
          variant: "destructive",
        })
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(newUser.email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        })
        return
      }

      if (newUser.password.length < 6) {
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      })

      const result = await response.json()

      if (!response.ok) {
        switch (result.error) {
          case "already_exists":
            toast({
              title: "Email Already Exists",
              description:
                result.message ||
                `A user with email ${newUser.email} already exists. Please use a different email address.`,
              variant: "destructive",
            })
            break
          case "invalid_email":
            toast({
              title: "Invalid Email",
              description: result.message || "Please enter a valid email address",
              variant: "destructive",
            })
            break
          case "password_error":
            toast({
              title: "Password Error",
              description: result.message,
              variant: "destructive",
            })
            break
          default:
            // Fallback for legacy error format and other errors
            if (result.error && result.error.includes && result.error.includes("already been registered")) {
              toast({
                title: "Email Already Exists",
                description: `A user with email ${newUser.email} already exists. Please use a different email address.`,
                variant: "destructive",
              })
            } else {
              toast({
                title: "Error Creating User",
                description: result.message || result.error || "Failed to create user. Please try again.",
                variant: "destructive",
              })
            }
        }
        return
      }

      toast({
        title: "Success",
        description: `User ${newUser.first_name} ${newUser.last_name} created successfully`,
      })

      setNewUser({ username: "", first_name: "", last_name: "", email: "", role: "", password: "" })
      setIsDialogOpen(false)
      await fetchData()
    } catch (error: any) {
      console.error("[v0] Error creating user:", error)
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreatingUser(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const { error } = await supabase.from("profiles").delete().eq("id", userId)

      if (error) throw error

      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      fetchData()
    } catch (error) {
      console.error("Error deleting user:", error)
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800"
      case "Technician":
        return "bg-blue-100 text-blue-800"
      case "Customer":
        return "bg-green-100 text-green-800"
      case "SuperAdmin":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Admin">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Admin">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">User Management</h2>
        </div>

        <div className="flex gap-3 pb-4 border-b">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                New User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new user to the system</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="col-span-3"
                    disabled={isCreatingUser}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="first_name" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="first_name"
                    value={newUser.first_name}
                    onChange={(e) => setNewUser({ ...newUser, first_name: e.target.value })}
                    className="col-span-3"
                    disabled={isCreatingUser}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="last_name" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="last_name"
                    value={newUser.last_name}
                    onChange={(e) => setNewUser({ ...newUser, last_name: e.target.value })}
                    className="col-span-3"
                    disabled={isCreatingUser}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="col-span-3"
                    disabled={isCreatingUser}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="password" className="text-right">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="col-span-3"
                    disabled={isCreatingUser}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                    disabled={isCreatingUser}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Technician">Technician</SelectItem>
                      <SelectItem value="Customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  onClick={() => {
                    createUser()
                  }}
                  disabled={isCreatingUser}
                >
                  {isCreatingUser ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Technician">Technician</SelectItem>
                <SelectItem value="Customer">Customer</SelectItem>
                <SelectItem value="SuperAdmin">Super Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <CardTitle className="text-lg">
                          {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                        </CardTitle>
                        <CardDescription>@{user.username}</CardDescription>
                      </div>
                      <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteUser(user.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Email:</span> {user.email || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                {users.length === 0 ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">Database setup required</p>
                    <p className="text-sm text-muted-foreground">
                      Run the database scripts to enable user management functionality
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No users found matching your criteria.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
