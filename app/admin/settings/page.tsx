"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Save, RefreshCw, Database, Bell, Shield } from "lucide-react"
import { createBrowserClient } from "@supabase/ssr"

interface SystemSettings {
  id: string
  company_name: string
  company_email: string
  company_phone: string
  company_address: string
  logo_url: string
  timezone: string
  date_format: string
  currency: string
  maintenance_reminder_days: number
  auto_assign_jobs: boolean
  email_notifications: boolean
  sms_notifications: boolean
  backup_frequency: string
  max_file_size_mb: number
  allowed_file_types: string[]
  session_timeout_minutes: number
  password_min_length: number
  require_2fa: boolean
  created_at: string
  updated_at: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const [formData, setFormData] = useState({
    company_name: "",
    company_email: "",
    company_phone: "",
    company_address: "",
    logo_url: "",
    timezone: "UTC",
    date_format: "YYYY-MM-DD",
    currency: "USD",
    maintenance_reminder_days: 7,
    auto_assign_jobs: false,
    email_notifications: true,
    sms_notifications: false,
    backup_frequency: "daily",
    max_file_size_mb: 10,
    allowed_file_types: "pdf,doc,docx,jpg,jpeg,png",
    session_timeout_minutes: 60,
    password_min_length: 8,
    require_2fa: false,
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("system_settings").select("*").single()

      if (error && error.code !== "PGRST116") throw error

      if (data) {
        setSettings(data)
        setFormData({
          company_name: data.company_name || "",
          company_email: data.company_email || "",
          company_phone: data.company_phone || "",
          company_address: data.company_address || "",
          logo_url: data.logo_url || "",
          timezone: data.timezone || "UTC",
          date_format: data.date_format || "YYYY-MM-DD",
          currency: data.currency || "USD",
          maintenance_reminder_days: data.maintenance_reminder_days || 7,
          auto_assign_jobs: data.auto_assign_jobs || false,
          email_notifications: data.email_notifications || true,
          sms_notifications: data.sms_notifications || false,
          backup_frequency: data.backup_frequency || "daily",
          max_file_size_mb: data.max_file_size_mb || 10,
          allowed_file_types: data.allowed_file_types?.join(",") || "pdf,doc,docx,jpg,jpeg,png",
          session_timeout_minutes: data.session_timeout_minutes || 60,
          password_min_length: data.password_min_length || 8,
          require_2fa: data.require_2fa || false,
        })
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const settingsData = {
        ...formData,
        allowed_file_types: formData.allowed_file_types
          .split(",")
          .map((type) => type.trim())
          .filter(Boolean),
      }

      if (settings) {
        const { error } = await supabase.from("system_settings").update(settingsData).eq("id", settings.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from("system_settings").insert([settingsData])

        if (error) throw error
      }

      await fetchSettings()
    } catch (error) {
      console.error("Error saving settings:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading settings...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>Basic company details and branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_name">Company Name</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Your Company Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_email">Company Email</Label>
                    <Input
                      id="company_email"
                      type="email"
                      value={formData.company_email}
                      onChange={(e) => setFormData({ ...formData, company_email: e.target.value })}
                      placeholder="contact@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company_phone">Company Phone</Label>
                    <Input
                      id="company_phone"
                      value={formData.company_phone}
                      onChange={(e) => setFormData({ ...formData, company_phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="company_address">Company Address</Label>
                  <Textarea
                    id="company_address"
                    value={formData.company_address}
                    onChange={(e) => setFormData({ ...formData, company_address: e.target.value })}
                    placeholder="123 Business St, City, State 12345"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Regional Settings</CardTitle>
                <CardDescription>Timezone, date format, and currency preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      placeholder="UTC"
                    />
                  </div>
                  <div>
                    <Label htmlFor="date_format">Date Format</Label>
                    <Input
                      id="date_format"
                      value={formData.date_format}
                      onChange={(e) => setFormData({ ...formData, date_format: e.target.value })}
                      placeholder="YYYY-MM-DD"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      placeholder="USD"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>Configure how and when notifications are sent</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications via email</p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={formData.email_notifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, email_notifications: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sms_notifications">SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send notifications via SMS</p>
                </div>
                <Switch
                  id="sms_notifications"
                  checked={formData.sms_notifications}
                  onCheckedChange={(checked) => setFormData({ ...formData, sms_notifications: checked })}
                />
              </div>

              <div>
                <Label htmlFor="maintenance_reminder_days">Maintenance Reminder (Days)</Label>
                <Input
                  id="maintenance_reminder_days"
                  type="number"
                  value={formData.maintenance_reminder_days}
                  onChange={(e) =>
                    setFormData({ ...formData, maintenance_reminder_days: Number.parseInt(e.target.value) || 7 })
                  }
                  placeholder="7"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Send maintenance reminders this many days in advance
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>Configure security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="session_timeout_minutes">Session Timeout (Minutes)</Label>
                  <Input
                    id="session_timeout_minutes"
                    type="number"
                    value={formData.session_timeout_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, session_timeout_minutes: Number.parseInt(e.target.value) || 60 })
                    }
                    placeholder="60"
                  />
                </div>
                <div>
                  <Label htmlFor="password_min_length">Minimum Password Length</Label>
                  <Input
                    id="password_min_length"
                    type="number"
                    value={formData.password_min_length}
                    onChange={(e) =>
                      setFormData({ ...formData, password_min_length: Number.parseInt(e.target.value) || 8 })
                    }
                    placeholder="8"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="require_2fa">Require Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for all users</p>
                </div>
                <Switch
                  id="require_2fa"
                  checked={formData.require_2fa}
                  onCheckedChange={(checked) => setFormData({ ...formData, require_2fa: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  File Management
                </CardTitle>
                <CardDescription>Configure file upload and storage settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="max_file_size_mb">Maximum File Size (MB)</Label>
                  <Input
                    id="max_file_size_mb"
                    type="number"
                    value={formData.max_file_size_mb}
                    onChange={(e) =>
                      setFormData({ ...formData, max_file_size_mb: Number.parseInt(e.target.value) || 10 })
                    }
                    placeholder="10"
                  />
                </div>

                <div>
                  <Label htmlFor="allowed_file_types">Allowed File Types</Label>
                  <Input
                    id="allowed_file_types"
                    value={formData.allowed_file_types}
                    onChange={(e) => setFormData({ ...formData, allowed_file_types: e.target.value })}
                    placeholder="pdf,doc,docx,jpg,jpeg,png"
                  />
                  <p className="text-sm text-muted-foreground mt-1">Comma-separated list of allowed file extensions</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>Configure automated system behaviors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto_assign_jobs">Auto-assign Job Cards</Label>
                    <p className="text-sm text-muted-foreground">Automatically assign jobs to available technicians</p>
                  </div>
                  <Switch
                    id="auto_assign_jobs"
                    checked={formData.auto_assign_jobs}
                    onCheckedChange={(checked) => setFormData({ ...formData, auto_assign_jobs: checked })}
                  />
                </div>

                <div>
                  <Label htmlFor="backup_frequency">Backup Frequency</Label>
                  <Input
                    id="backup_frequency"
                    value={formData.backup_frequency}
                    onChange={(e) => setFormData({ ...formData, backup_frequency: e.target.value })}
                    placeholder="daily"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    How often to backup system data (daily, weekly, monthly)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
