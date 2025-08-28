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
  full_name: string
  role: string
  company_name: string
  created_at: string
}

interface Company {
  id: string
  name: string
  description: string
  created_at: string
}

interface FaultSolution {
  id: string
  fault_title: string
  solution: string
  equipment_type: string
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [faultSolutions, setFaultSolutions] = useState<FaultSolution[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [loading, setLoading] = useState(true)

  // New user form state
  const [newUser, setNewUser] = useState({
    username: "",
    full_name: "",
    email: "",
    role: "",
    company_name: "",
    password: "",
  })

  // New company form state
  const [newCompany, setNewCompany] = useState({
    name: "",
    description: "",
  })

  // New fault solution form state
  const [newFaultSolution, setNewFaultSolution] = useState({
    fault_title: "",
    solution: "",
    equipment_type: "",
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
      // Fetch users
      let usersData = []
      try {
        const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

        if (error) {
          // Check for table not found errors
          if (
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
        console.log("[v0] Error querying profiles table:", tableError.message)
        // If it's a table-related error, use empty data
        if (
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

      // Fetch companies (mock data for now)
      setCompanies([
        {
          id: "1",
          name: "STP Engineering",
          description: "Main engineering company",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          name: "ABC Manufacturing",
          description: "Manufacturing partner",
          created_at: new Date().toISOString(),
        },
      ])

      // Fetch fault solutions (mock data for now)
      setFaultSolutions([
        {
          id: "1",
          fault_title: "Motor overheating",
          solution: "Check cooling system and replace filters",
          equipment_type: "Motor",
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          fault_title: "Pump not starting",
          solution: "Check electrical connections and fuses",
          equipment_type: "Pump",
          created_at: new Date().toISOString(),
        },
      ])
    } catch (error) {
      console.error("Error fetching data:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch data"
      if (!errorMessage.includes("Could not find the table") && !errorMessage.includes("schema cache")) {
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
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.company_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  const createUser = async () => {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: newUser.password,
      })

      if (authError) throw authError

      if (authData.user) {
        // Create profile
        const { error: profileError } = await supabase.from("profiles").insert({
          id: authData.user.id,
          username: newUser.username,
          full_name: newUser.full_name,
          role: newUser.role,
          company_name: newUser.company_name,
          email: newUser.email,
        })

        if (profileError) throw profileError
      }

      toast({
        title: "Success",
        description: "User created successfully",
      })

      setNewUser({ username: "", full_name: "", email: "", role: "", company_name: "", password: "" })
      fetchData()
    } catch (error: any) {
      console.error("Error creating user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      })
    }
  }

  const createCompany = async () => {
    try {
      const newCompanyData = {
        id: Date.now().toString(),
        name: newCompany.name,
        description: newCompany.description,
        created_at: new Date().toISOString(),
      }

      setCompanies([newCompanyData, ...companies])

      toast({
        title: "Success",
        description: "Company created successfully",
      })

      setNewCompany({ name: "", description: "" })
    } catch (error: any) {
      console.error("Error creating company:", error)
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      })
    }
  }

  const createFaultSolution = async () => {
    try {
      const newFaultData = {
        id: Date.now().toString(),
        fault_title: newFaultSolution.fault_title,
        solution: newFaultSolution.solution,
        equipment_type: newFaultSolution.equipment_type,
        created_at: new Date().toISOString(),
      }

      setFaultSolutions([newFaultData, ...faultSolutions])

      toast({
        title: "Success",
        description: "Fault solution created successfully",
      })

      setNewFaultSolution({ fault_title: "", solution: "", equipment_type: "" })
    } catch (error: any) {
      console.error("Error creating fault solution:", error)
      toast({
        title: "Error",
        description: "Failed to create fault solution",
        variant: "destructive",
      })
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
          <Dialog>
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
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="full_name" className="text-right">
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                    className="col-span-3"
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
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    Role
                  </Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="company" className="text-right">
                    Company
                  </Label>
                  <Input
                    id="company"
                    value={newUser.company_name}
                    onChange={(e) => setNewUser({ ...newUser, company_name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createUser}>Create User</Button>
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
                        <CardTitle className="text-lg">{user.full_name || user.username}</CardTitle>
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
                      <span className="font-medium">Company:</span> {user.company_name || "N/A"}
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
