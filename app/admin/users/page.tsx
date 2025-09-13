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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [isUpdatingUser, setIsUpdatingUser] = useState(false)

  const [newUser, setNewUser] = useState({
    username: "",
    first_name: "",
    last_name: "",
    role: "",
    password: "",
  })

  const [editUser, setEditUser] = useState({
    username: "",
    first_name: "",
    last_name: "",
    role: "",
  })

  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter])

  const fetchUsers = async () => {
    try {
      console.log("[v0] Fetching users from new API")
      const response = await fetch("/api/admin/users")

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to fetch users")
      }

      const data = await response.json()
      console.log("[v0] Users fetched successfully:", data.users?.length || 0)
      setUsers(data.users || [])
    } catch (error) {
      console.error("[v0] Error fetching users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
      setUsers([])
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
          user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const createUser = async () => {
    try {
      console.log("[v0] Create user button clicked")
      setIsCreatingUser(true)
      console.log("[v0] Form data:", newUser)

      // Trim all fields
      const trimmedUser = {
        username: newUser.username.trim(),
        first_name: newUser.first_name.trim(),
        last_name: newUser.last_name.trim(),
        password: newUser.password.trim(),
        role: newUser.role.trim(),
      }

      // Validate required fields
      const validationErrors = []
      if (!trimmedUser.username) validationErrors.push("username")
      if (!trimmedUser.first_name) validationErrors.push("first name")
      if (!trimmedUser.last_name) validationErrors.push("last name")
      if (!trimmedUser.password) validationErrors.push("password")
      if (!trimmedUser.role) validationErrors.push("role")

      if (validationErrors.length > 0) {
        console.log("[v0] Validation errors:", validationErrors)
        toast({
          title: "Validation Error",
          description: `Please fill in all fields. Missing: ${validationErrors.join(", ")}`,
          variant: "destructive",
        })
        return
      }

      if (trimmedUser.password.length < 6) {
        console.log("[v0] Password too short")
        toast({
          title: "Password Too Short",
          description: "Password must be at least 6 characters long",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Making API call to /api/admin/users")
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trimmedUser),
      })

      console.log("[v0] API response status:", response.status)
      const result = await response.json()
      console.log("[v0] API response data:", result)

      if (!response.ok) {
        console.log("[v0] API error:", result.error)
        toast({
          title: "Error Creating User",
          description: result.error || "Failed to create user. Please try again.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] User created successfully")
      toast({
        title: "Success",
        description: result.message || `User ${trimmedUser.first_name} ${trimmedUser.last_name} created successfully`,
      })

      // Reset form and close dialog
      setNewUser({ username: "", first_name: "", last_name: "", role: "", password: "" })
      setIsDialogOpen(false)

      // Refresh users list
      await fetchUsers()
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

  const openEditDialog = (user: UserProfile) => {
    setEditingUser(user)
    setEditUser({
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    })
    setIsEditDialogOpen(true)
  }

  const updateUser = async () => {
    if (!editingUser) return

    try {
      console.log("[v0] Update user button clicked")
      setIsUpdatingUser(true)
      console.log("[v0] Edit form data:", editUser)

      // Trim all fields
      const trimmedUser = {
        username: editUser.username.trim(),
        first_name: editUser.first_name.trim(),
        last_name: editUser.last_name.trim(),
        role: editUser.role.trim(),
      }

      // Validate required fields
      const validationErrors = []
      if (!trimmedUser.username) validationErrors.push("username")
      if (!trimmedUser.first_name) validationErrors.push("first name")
      if (!trimmedUser.last_name) validationErrors.push("last name")
      if (!trimmedUser.role) validationErrors.push("role")

      if (validationErrors.length > 0) {
        console.log("[v0] Validation errors:", validationErrors)
        toast({
          title: "Validation Error",
          description: `Please fill in all fields. Missing: ${validationErrors.join(", ")}`,
          variant: "destructive",
        })
        return
      }

      console.log("[v0] Making API call to update user")
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(trimmedUser),
      })

      console.log("[v0] API response status:", response.status)
      const result = await response.json()
      console.log("[v0] API response data:", result)

      if (!response.ok) {
        console.log("[v0] API error:", result.error)
        toast({
          title: "Error Updating User",
          description: result.error || "Failed to update user. Please try again.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] User updated successfully")
      toast({
        title: "Success",
        description: result.message || `User ${trimmedUser.first_name} ${trimmedUser.last_name} updated successfully`,
      })

      // Close dialog and refresh users list
      setIsEditDialogOpen(false)
      setEditingUser(null)
      await fetchUsers()
    } catch (error: any) {
      console.error("[v0] Error updating user:", error)
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection and try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingUser(false)
    }
  }

  const deleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      console.log("[v0] Deleting user:", userId)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        console.log("[v0] Delete API error:", result.error)
        toast({
          title: "Error Deleting User",
          description: result.error || "Failed to delete user. Please try again.",
          variant: "destructive",
        })
        return
      }

      console.log("[v0] User deleted successfully")
      toast({
        title: "Success",
        description: result.message || "User deleted successfully",
      })

      // Refresh users list
      await fetchUsers()
    } catch (error: any) {
      console.error("[v0] Error deleting user:", error)
      toast({
        title: "Network Error",
        description: "Unable to connect to the server. Please check your connection and try again.",
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
      case "Super Admin":
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
                    placeholder="Enter username"
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
                    placeholder="Enter first name"
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
                    placeholder="Enter last name"
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
                    placeholder="Enter password (min 6 characters)"
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
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault()
                    console.log("[v0] Create User button clicked, current form state:", newUser)
                    createUser()
                  }}
                  disabled={isCreatingUser}
                >
                  {isCreatingUser ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit User</DialogTitle>
                <DialogDescription>Update user information</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="edit-username"
                    value={editUser.username}
                    onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                    className="col-span-3"
                    disabled={isUpdatingUser}
                    placeholder="Enter username"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-first-name" className="text-right">
                    First Name
                  </Label>
                  <Input
                    id="edit-first-name"
                    value={editUser.first_name}
                    onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
                    className="col-span-3"
                    disabled={isUpdatingUser}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-last-name" className="text-right">
                    Last Name
                  </Label>
                  <Input
                    id="edit-last-name"
                    value={editUser.last_name}
                    onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
                    className="col-span-3"
                    disabled={isUpdatingUser}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">
                    Role
                  </Label>
                  <Select
                    value={editUser.role}
                    onValueChange={(value) => setEditUser({ ...editUser, role: value })}
                    disabled={isUpdatingUser}
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
                  type="submit"
                  onClick={(e) => {
                    e.preventDefault()
                    updateUser()
                  }}
                  disabled={isUpdatingUser}
                >
                  {isUpdatingUser ? "Updating..." : "Update User"}
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
                <SelectItem value="Super Admin">Super Admin</SelectItem>
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
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(user.id, `${user.first_name} ${user.last_name}` || user.username)}
                      >
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
                    <p className="text-muted-foreground">No users found</p>
                    <p className="text-sm text-muted-foreground">
                      Create your first user using the "New User" button above
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
