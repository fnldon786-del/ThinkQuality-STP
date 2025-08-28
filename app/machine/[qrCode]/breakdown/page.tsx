"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Logo } from "@/components/logo"
import { Footer } from "@/components/footer"
import { AlertTriangle, ArrowLeft } from "lucide-react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

interface Machine {
  id: string
  name: string
  machine_number: string
}

export default function BreakdownRequestPage() {
  const params = useParams()
  const router = useRouter()
  const qrCode = params.qrCode as string
  const [machine, setMachine] = useState<Machine | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    urgency: "Medium",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMachine()
  }, [qrCode])

  const loadMachine = async () => {
    try {
      const { data, error } = await supabase
        .from("machines")
        .select("id, name, machine_number")
        .eq("qr_code", qrCode)
        .single()

      if (error) throw error
      setMachine(data)
    } catch (error) {
      console.error("Error loading machine:", error)
      setError("Machine not found")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!machine) return

    setIsLoading(true)
    setError(null)

    try {
      // For anonymous users, we'll create a breakdown request without authentication
      const { error: requestError } = await supabase.from("breakdown_requests").insert({
        machine_id: machine.id,
        customer_id: null, // Anonymous request
        title: formData.title,
        description: `${formData.description}\n\nContact Details:\nName: ${formData.customerName}\nEmail: ${formData.customerEmail}\nPhone: ${formData.customerPhone}`,
        urgency: formData.urgency,
        status: "Submitted",
      })

      if (requestError) throw requestError

      setIsSubmitted(true)
    } catch (error: unknown) {
      console.error("Error submitting breakdown request:", error)
      setError(error instanceof Error ? error.message : "Failed to submit request")
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card shadow-sm p-4">
          <Logo size="md" showText={true} />
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card shadow-sm p-4">
          <Logo size="md" showText={true} />
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Request Submitted</h2>
              <p className="text-muted-foreground mb-4">
                Your breakdown request has been submitted successfully. Our team will contact you shortly.
              </p>
              <Button asChild>
                <Link href={`/machine/${qrCode}`}>Back to Machine</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/machine/${qrCode}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Logo size="md" showText={true} />
        </div>
      </header>

      <main className="flex-1 p-4 max-w-2xl mx-auto w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Report Breakdown
            </CardTitle>
            {machine && (
              <p className="text-muted-foreground">
                {machine.name} ({machine.machine_number})
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Brief description of the issue"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the problem in detail, including any error messages or symptoms"
                  rows={4}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency Level</Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, urgency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low - Can wait for scheduled maintenance</SelectItem>
                    <SelectItem value="Medium">Medium - Should be addressed soon</SelectItem>
                    <SelectItem value="High">High - Affecting operations</SelectItem>
                    <SelectItem value="Critical">Critical - Machine down/safety issue</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Contact Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="customerName">Your Name</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                    placeholder="Full name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerEmail">Email Address</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customerEmail: e.target.value }))}
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>

              {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Submitting..." : "Submit Breakdown Request"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href={`/machine/${qrCode}`}>Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
