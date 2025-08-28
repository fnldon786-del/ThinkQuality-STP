"use client"

import type React from "react"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { MessageSquare, Star } from "lucide-react"

export default function CustomerFeedbackPage() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    type: "",
    subject: "",
    description: "",
    rating: 0,
  })

  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // TODO: Implement actual feedback submission
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Feedback submitted successfully",
      })
      setFormData({ type: "", subject: "", description: "", rating: 0 })
      setLoading(false)
    }, 1000)
  }

  const handleStarClick = (rating: number) => {
    setFormData({ ...formData, rating })
  }

  return (
    <DashboardLayout role="Customer">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Issues & Feedback</h2>
          <p className="text-muted-foreground mt-2">Report issues or provide feedback on services</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Submit Feedback
            </CardTitle>
            <CardDescription>Help us improve our services by sharing your feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Feedback Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select feedback type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="issue">Report Issue</SelectItem>
                    <SelectItem value="suggestion">Suggestion</SelectItem>
                    <SelectItem value="compliment">Compliment</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief summary of your feedback"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Overall Rating</Label>
                <div className="flex space-x-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 cursor-pointer ${
                        i < formData.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                      }`}
                      onClick={() => handleStarClick(i + 1)}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of your feedback"
                  rows={4}
                  required
                />
              </div>

              <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit Feedback"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
