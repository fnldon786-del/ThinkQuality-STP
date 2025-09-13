"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { Building2, Plus, Edit, Trash2, Search } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Company {
  id: string
  name: string
  description: string
  logo_url?: string
  contact_email: string
  contact_phone: string
  address: string
  created_at: string
  updated_at: string
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const [newCompany, setNewCompany] = useState({
    name: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    address: "",
  })

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    filterCompanies()
  }, [companies, searchTerm])

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase.from("companies").select("*").order("created_at", { ascending: false })

      if (error) {
        if (error.code === "PGRST205" || error.message.includes("Could not find the table")) {
          console.log("[v0] Companies table not found, showing setup message")
          setCompanies([])
        } else {
          throw error
        }
      } else {
        setCompanies(data || [])
      }
    } catch (error) {
      console.error("Error fetching companies:", error)
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterCompanies = () => {
    let filtered = companies

    if (searchTerm) {
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          company.contact_email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    setFilteredCompanies(filtered)
  }

  const createCompany = async () => {
    try {
      const { error } = await supabase.from("companies").insert([newCompany])

      if (error) throw error

      toast({
        title: "Success",
        description: "Company created successfully",
      })

      setNewCompany({
        name: "",
        description: "",
        contact_email: "",
        contact_phone: "",
        address: "",
      })
      setIsCreateDialogOpen(false)
      fetchCompanies()
    } catch (error: any) {
      console.error("Error creating company:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to create company",
        variant: "destructive",
      })
    }
  }

  const deleteCompany = async (companyId: string) => {
    if (!confirm("Are you sure you want to delete this company?")) return

    try {
      const { error } = await supabase.from("companies").delete().eq("id", companyId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Company deleted successfully",
      })
      fetchCompanies()
    } catch (error) {
      console.error("Error deleting company:", error)
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      })
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
          <h2 className="text-3xl font-bold text-foreground">Company Management</h2>
          <p className="text-muted-foreground mt-2">Manage companies and organizational structure</p>
        </div>

        <div className="flex gap-3 pb-4 border-b">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Company</DialogTitle>
                <DialogDescription>Add a new company to the system</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newCompany.description}
                    onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                    placeholder="Enter company description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={newCompany.contact_email}
                    onChange={(e) => setNewCompany({ ...newCompany, contact_email: e.target.value })}
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={newCompany.contact_phone}
                    onChange={(e) => setNewCompany({ ...newCompany, contact_phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={newCompany.address}
                    onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                    placeholder="Enter company address"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createCompany}>Create Company</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Companies List */}
        {filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              {companies.length === 0 ? (
                <div className="space-y-2">
                  <Building2 className="h-12 w-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">No companies found</p>
                  <p className="text-sm text-muted-foreground">
                    {loading ? "Loading..." : "Create your first company to get started"}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground">No companies found matching your search.</p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCompanies.map((company) => (
              <Card key={company.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <CardDescription>{company.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deleteCompany(company.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Email:</span> {company.contact_email || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Phone:</span> {company.contact_phone || "N/A"}
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium">Address:</span> {company.address || "N/A"}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(company.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
