"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { Settings, Save, Database, Shield, Bell } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemSettings {
  company_name: string
  company_logo: string
  maintenance_mode: boolean
  email_notifications: boolean
  sms_notifications: boolean
  auto_backup: boolean
  backup_frequency: string
  session_timeout: number
  password_policy: string
  theme: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    company_name: "ThinkQuality",
    company_logo: "",
    maintenance_mode: false,
    email_notifications: true,
    sms_notifications: false,
    auto_backup: true,
    backup_frequency: "daily",
    session_timeout: 30,
    password_policy: "medium",
    theme: "system",
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const supabase = createClient()
  const { toast } = useToast()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // In a real implementation, you would load settings from a database table
      // For now, we'll use default values
      console.log("[v0] Loading system settings...")
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      // In a real implementation, you would save settings to a database table
      console.log("[v0] Saving system settings:", settings)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">System Settings</h2>
            <p className="text-muted-foreground mt-2">Configure system settings and preferences</p>
          </div>
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <div className="grid gap-6">
          {/* General Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>Basic system configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={settings.company_name}
                    onChange={(e) => updateSetting("company_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => updateSetting("theme", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">Enable maintenance mode to restrict system access</p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => updateSetting("maintenance_mode", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Configure notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send email notifications for system events</p>
                </div>
                <Switch
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send SMS notifications for critical alerts</p>
                </div>
                <Switch
                  checked={settings.sms_notifications}
                  onCheckedChange={(checked) => updateSetting("sms_notifications", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>Security and authentication settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) => updateSetting("session_timeout", Number.parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password_policy">Password Policy</Label>
                  <Select
                    value={settings.password_policy}
                    onValueChange={(value) => updateSetting("password_policy", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - 6 characters minimum</SelectItem>
                      <SelectItem value="medium">Medium - 8 characters, mixed case</SelectItem>
                      <SelectItem value="high">High - 12 characters, mixed case, numbers, symbols</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database & Backup
              </CardTitle>
              <CardDescription>Database maintenance and backup configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Automatic Backups</Label>
                  <p className="text-sm text-muted-foreground">Enable automatic database backups</p>
                </div>
                <Switch
                  checked={settings.auto_backup}
                  onCheckedChange={(checked) => updateSetting("auto_backup", checked)}
                />
              </div>
              {settings.auto_backup && (
                <div className="space-y-2">
                  <Label htmlFor="backup_frequency">Backup Frequency</Label>
                  <Select
                    value={settings.backup_frequency}
                    onValueChange={(value) => updateSetting("backup_frequency", value)}
                  >
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Separator />
              <div className="flex gap-2">
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Create Backup Now
                </Button>
                <Button variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  View Backup History
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
              <CardDescription>Current system status and information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">System Version:</span> v2.1.0
                </div>
                <div>
                  <span className="font-medium">Database Version:</span> PostgreSQL 15.3
                </div>
                <div>
                  <span className="font-medium">Last Backup:</span> {new Date().toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">System Status:</span>
                  <span className="ml-2 text-green-600">Operational</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
