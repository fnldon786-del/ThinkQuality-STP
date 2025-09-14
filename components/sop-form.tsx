"use client"

import type React from "react"
import { FileUpload } from "@/components/file-upload"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

interface SOPCategory {
  id: string
  name: string
  color: string
}

interface SOPStep {
  step_number: number
  title: string
  description: string
  warning_notes: string
  estimated_minutes: number
}

interface UploadedFile {
  file_name: string
  file_url: string
  file_type: string
  file_size: number
}

interface SOPFormData {
  title: string
  description: string
  category_id: string
  content: string
  equipment_types: string[]
  safety_requirements: string[]
  required_tools: string[]
  estimated_time_minutes: string
  difficulty_level: string
  effective_date: Date | undefined
  review_date: Date | undefined
  steps: SOPStep[]
  attachments: UploadedFile[]
}

interface SOPFormProps {
  onSuccess?: () => void
  initialData?: Partial<SOPFormData>
}

export function SOPForm({ onSuccess, initialData }: SOPFormProps) {
  const [formData, setFormData] = useState<SOPFormData>({
    title: "",
    description: "",
    category_id: "",
    content: "",
    equipment_types: [],
    safety_requirements: [],
    required_tools: [],
    estimated_time_minutes: "",
    difficulty_level: "Intermediate",
    effective_date: undefined,
    review_date: undefined,
    steps: [{ step_number: 1, title: "", description: "", warning_notes: "", estimated_minutes: 0 }],
    attachments: [],
    ...initialData,
  })
  const [categories, setCategories] = useState<SOPCategory[]>([])
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newEquipmentType, setNewEquipmentType] = useState("")
  const [newSafetyReq, setNewSafetyReq] = useState("")
  const [newTool, setNewTool] = useState("")
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const loadData = async () => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Load categories
      const { data: categories } = await supabase.from("sop_categories").select("*").order("name")

      if (categories) {
        setCategories(categories)
      }
    }

    loadData()
  }, [supabase])

  const handleInputChange = (field: keyof SOPFormData, value: string | Date | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addArrayItem = (field: "equipment_types" | "safety_requirements" | "required_tools", value: string) => {
    if (value.trim()) {
      setFormData((prev) => ({
        ...prev,
        [field]: [...prev[field], value.trim()],
      }))
      // Clear the input
      if (field === "equipment_types") setNewEquipmentType("")
      if (field === "safety_requirements") setNewSafetyReq("")
      if (field === "required_tools") setNewTool("")
    }
  }

  const removeArrayItem = (field: "equipment_types" | "safety_requirements" | "required_tools", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }))
  }

  const addStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          step_number: prev.steps.length + 1,
          title: "",
          description: "",
          warning_notes: "",
          estimated_minutes: 0,
        },
      ],
    }))
  }

  const removeStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index).map((step, i) => ({ ...step, step_number: i + 1 })),
    }))
  }

  const updateStep = (index: number, field: keyof SOPStep, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) => (i === index ? { ...step, [field]: value } : step)),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setIsLoading(true)
    setError(null)

    try {
      // Create SOP
      const { data: sop, error: sopError } = await supabase
        .from("sops")
        .insert({
          sop_number: `SOP-${Date.now()}`, // Temporary - will be replaced by function
          title: formData.title,
          description: formData.description,
          category_id: formData.category_id || null,
          content: formData.content,
          equipment_types: formData.equipment_types,
          safety_requirements: formData.safety_requirements,
          required_tools: formData.required_tools,
          estimated_time_minutes: formData.estimated_time_minutes
            ? Number.parseInt(formData.estimated_time_minutes)
            : null,
          difficulty_level: formData.difficulty_level,
          effective_date: formData.effective_date?.toISOString(),
          review_date: formData.review_date?.toISOString(),
          created_by: currentUser.id,
        })
        .select()
        .single()

      if (sopError) throw sopError

      // Create steps
      if (sop && formData.steps.filter((step) => step.title.trim()).length > 0) {
        const stepsToInsert = formData.steps
          .filter((step) => step.title.trim())
          .map((step) => ({
            sop_id: sop.id,
            step_number: step.step_number,
            title: step.title.trim(),
            description: step.description.trim(),
            warning_notes: step.warning_notes.trim() || null,
            estimated_minutes: step.estimated_minutes || null,
          }))

        const { error: stepsError } = await supabase.from("sop_steps").insert(stepsToInsert)

        if (stepsError) throw stepsError
      }

      if (sop && formData.attachments.length > 0) {
        const attachmentsToInsert = formData.attachments.map((attachment) => ({
          sop_id: sop.id,
          file_name: attachment.file_name,
          file_url: attachment.file_url,
          file_type: attachment.file_type,
          file_size: attachment.file_size,
          uploaded_by: currentUser.id,
        }))

        const { error: attachmentsError } = await supabase.from("sop_attachments").insert(attachmentsToInsert)

        if (attachmentsError) throw attachmentsError
      }

      onSuccess?.()
      router.push("/admin/sops")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Standard Operating Procedure</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">SOP Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="Enter SOP title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => handleInputChange("category_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
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
              placeholder="Brief description of the procedure"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty_level">Difficulty Level</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) => handleInputChange("difficulty_level", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_time_minutes">Estimated Time (minutes)</Label>
              <Input
                id="estimated_time_minutes"
                type="number"
                value={formData.estimated_time_minutes}
                onChange={(e) => handleInputChange("estimated_time_minutes", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="effective_date">Effective Date</Label>
              <Input
                id="effective_date"
                type="date"
                value={formData.effective_date ? formData.effective_date.toISOString().split("T")[0] : ""}
                onChange={(e) =>
                  handleInputChange("effective_date", e.target.value ? new Date(e.target.value) : undefined)
                }
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review_date">Review Date</Label>
              <Input
                id="review_date"
                type="date"
                value={formData.review_date ? formData.review_date.toISOString().split("T")[0] : ""}
                onChange={(e) =>
                  handleInputChange("review_date", e.target.value ? new Date(e.target.value) : undefined)
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Equipment Types</Label>
            <div className="flex gap-2">
              <Input
                value={newEquipmentType}
                onChange={(e) => setNewEquipmentType(e.target.value)}
                placeholder="Add equipment type"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addArrayItem("equipment_types", newEquipmentType))
                }
              />
              <Button type="button" variant="outline" onClick={() => addArrayItem("equipment_types", newEquipmentType)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.equipment_types.map((item, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {item}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeArrayItem("equipment_types", index)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Safety Requirements</Label>
            <div className="flex gap-2">
              <Input
                value={newSafetyReq}
                onChange={(e) => setNewSafetyReq(e.target.value)}
                placeholder="Add safety requirement"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addArrayItem("safety_requirements", newSafetyReq))
                }
              />
              <Button type="button" variant="outline" onClick={() => addArrayItem("safety_requirements", newSafetyReq)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.safety_requirements.map((item, index) => (
                <Badge key={index} variant="destructive" className="flex items-center gap-1">
                  {item}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeArrayItem("safety_requirements", index)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Required Tools</Label>
            <div className="flex gap-2">
              <Input
                value={newTool}
                onChange={(e) => setNewTool(e.target.value)}
                placeholder="Add required tool"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addArrayItem("required_tools", newTool))}
              />
              <Button type="button" variant="outline" onClick={() => addArrayItem("required_tools", newTool)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.required_tools.map((item, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {item}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeArrayItem("required_tools", index)} />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Procedure Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="Detailed procedure content and instructions"
              rows={6}
              required
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Procedure Steps</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-4 w-4 mr-1" />
                Add Step
              </Button>
            </div>
            {formData.steps.map((step, index) => (
              <Card key={index} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Step {step.step_number}</Label>
                    {formData.steps.length > 1 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => removeStep(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(index, "title", e.target.value)}
                    placeholder="Step title"
                  />
                  <Textarea
                    value={step.description}
                    onChange={(e) => updateStep(index, "description", e.target.value)}
                    placeholder="Step description"
                    rows={2}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Textarea
                      value={step.warning_notes}
                      onChange={(e) => updateStep(index, "warning_notes", e.target.value)}
                      placeholder="Warning notes (optional)"
                      rows={2}
                    />
                    <Input
                      type="number"
                      value={step.estimated_minutes}
                      onChange={(e) => updateStep(index, "estimated_minutes", Number.parseInt(e.target.value) || 0)}
                      placeholder="Estimated minutes"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <FileUpload
              onFilesUploaded={(files) => setFormData((prev) => ({ ...prev, attachments: files }))}
              existingFiles={formData.attachments}
              maxFiles={10}
              bucketName="sop-attachments"
            />
          </div>

          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create SOP"}
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
