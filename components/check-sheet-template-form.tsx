"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { Plus, X, Move } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import type { User } from "@supabase/supabase-js"

interface CheckSheetQuestion {
  id: string
  question_text: string
  question_type: "checkbox" | "text" | "number" | "select" | "rating"
  options?: string[]
  required: boolean
  order_index: number
}

interface CheckSheetTemplateFormData {
  title: string
  description: string
  category: string
  frequency: string
  estimated_minutes: string
  instructions: string
  questions: CheckSheetQuestion[]
}

interface CheckSheetTemplateFormProps {
  onSuccess?: () => void
  initialData?: Partial<CheckSheetTemplateFormData>
}

export function CheckSheetTemplateForm({ onSuccess, initialData }: CheckSheetTemplateFormProps) {
  const [formData, setFormData] = useState<CheckSheetTemplateFormData>({
    title: "",
    description: "",
    category: "",
    frequency: "Weekly",
    estimated_minutes: "",
    instructions: "",
    questions: [
      {
        id: "1",
        question_text: "",
        question_type: "checkbox",
        required: true,
        order_index: 1,
      },
    ],
    ...initialData,
  })

  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [supabase])

  const handleInputChange = (field: keyof CheckSheetTemplateFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addQuestion = () => {
    const newQuestion: CheckSheetQuestion = {
      id: Date.now().toString(),
      question_text: "",
      question_type: "checkbox",
      required: true,
      order_index: formData.questions.length + 1,
    }
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }))
  }

  const removeQuestion = (questionId: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((q) => q.id !== questionId)
        .map((q, index) => ({ ...q, order_index: index + 1 })),
    }))
  }

  const updateQuestion = (questionId: string, field: keyof CheckSheetQuestion, value: any) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)),
    }))
  }

  const addOption = (questionId: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === questionId ? { ...q, options: [...(q.options || []), ""] } : q)),
    }))
  }

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, options: q.options?.map((opt, idx) => (idx === optionIndex ? value : opt)) } : q,
      ),
    }))
  }

  const removeOption = (questionId: string, optionIndex: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, options: q.options?.filter((_, idx) => idx !== optionIndex) } : q,
      ),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setIsLoading(true)
    setError(null)

    try {
      // Mock submission for now - replace with actual Supabase insert when check_sheet_templates table exists
      console.log("Creating check sheet template:", formData)

      toast({
        title: "Success",
        description: "Check sheet template created successfully",
      })

      onSuccess?.()
      router.push("/admin/check-sheets")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "checkbox":
        return "Yes/No"
      case "text":
        return "Text Input"
      case "number":
        return "Number"
      case "select":
        return "Multiple Choice"
      case "rating":
        return "Rating (1-5)"
      default:
        return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Check Sheet Template</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Template Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter template title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Safety">Safety</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Quality">Quality</SelectItem>
                  <SelectItem value="Inspection">Inspection</SelectItem>
                  <SelectItem value="Compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the check sheet"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={formData.frequency} onValueChange={(value) => handleInputChange("frequency", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Quarterly">Quarterly</SelectItem>
                  <SelectItem value="Annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_minutes">Estimated Time (minutes)</Label>
              <Input
                id="estimated_minutes"
                type="number"
                value={formData.estimated_minutes}
                onChange={(e) => handleInputChange("estimated_minutes", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => handleInputChange("instructions", e.target.value)}
              placeholder="General instructions for completing this check sheet"
              rows={3}
            />
          </div>

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Check Sheet Questions</Label>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-1" />
                Add Question
              </Button>
            </div>

            {formData.questions.map((question, index) => (
              <Card key={question.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Move className="h-4 w-4 text-gray-400" />
                      <Label>Question {question.order_index}</Label>
                      <Badge variant="outline">{getQuestionTypeLabel(question.question_type)}</Badge>
                    </div>
                    {formData.questions.length > 1 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => removeQuestion(question.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Question Text</Label>
                      <Input
                        value={question.question_text}
                        onChange={(e) => updateQuestion(question.id, "question_text", e.target.value)}
                        placeholder="Enter question text"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <Select
                        value={question.question_type}
                        onValueChange={(value) => updateQuestion(question.id, "question_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checkbox">Yes/No</SelectItem>
                          <SelectItem value="text">Text Input</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="select">Multiple Choice</SelectItem>
                          <SelectItem value="rating">Rating (1-5)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {question.question_type === "select" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Options</Label>
                        <Button type="button" variant="outline" size="sm" onClick={() => addOption(question.id)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                      {question.options?.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          {(question.options?.length || 0) > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeOption(question.id, optionIndex)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`required-${question.id}`}
                      checked={question.required}
                      onChange={(e) => updateQuestion(question.id, "required", e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`required-${question.id}`}>Required question</Label>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Template"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
