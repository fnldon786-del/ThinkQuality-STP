import { createSuperAdmin } from "./actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SetupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Setup Super Admin</CardTitle>
          <CardDescription>Create the super admin account (admin@stp.com) to access all dashboards</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createSuperAdmin}>
            <Button type="submit" className="w-full">
              Create Super Admin Account
            </Button>
          </form>
          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              <strong>Email:</strong> admin@stp.com
            </p>
            <p>
              <strong>Password:</strong> 12345678
            </p>
            <p>
              <strong>Access:</strong> All dashboards
            </p>
          </div>
          <div className="mt-6 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium mb-2">Troubleshooting:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Click "Create Super Admin Account" above</li>
              <li>Go to the login page</li>
              <li>Use email: admin@stp.com</li>
              <li>Use password: 12345678</li>
              <li>Select any dashboard to access</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
