"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, PenTool } from "lucide-react"
import { DigitalSignature } from "./digital-signature"
import { SignatureDisplay } from "./signature-display"

interface WorkflowStep {
  id: string
  workflow_step: string
  required_role: string
  is_completed: boolean
  completed_by?: string
  completed_at?: string
  signature_id?: string
  notes?: string
}

interface SignOffWorkflowProps {
  referenceId: string
  referenceType: "job_card" | "sop" | "check_sheet"
  currentUserRole: string
  currentUserId: string
  currentUserName: string
  onWorkflowUpdate?: () => void
}

export function SignOffWorkflow({
  referenceId,
  referenceType,
  currentUserRole,
  currentUserId,
  currentUserName,
  onWorkflowUpdate,
}: SignOffWorkflowProps) {
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([])
  const [signatures, setSignatures] = useState<any[]>([])
  const [showSignature, setShowSignature] = useState(false)
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadWorkflowData()
  }, [referenceId, referenceType])

  const loadWorkflowData = async () => {
    try {
      // Load workflow steps
      const { data: steps } = await supabase
        .from("sign_off_workflows")
        .select("*")
        .eq("reference_id", referenceId)
        .eq("reference_type", referenceType)
        .order("created_at")

      // Load signatures
      const { data: sigs } = await supabase
        .from("signatures")
        .select("*")
        .eq("reference_id", referenceId)
        .eq("reference_type", referenceType)
        .order("signed_at")

      setWorkflowSteps(steps || [])
      setSignatures(sigs || [])
    } catch (error) {
      console.error("Error loading workflow data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const canSignStep = (step: WorkflowStep) => {
    if (step.is_completed) return false

    // Check if user has the required role
    if (step.required_role !== currentUserRole && !(currentUserRole === "Admin" || currentUserRole === "SuperAdmin")) {
      return false
    }

    // Check if previous steps are completed (basic workflow order)
    const stepOrder = ["technician_completion", "supervisor_approval", "customer_signoff", "final_approval"]
    const currentStepIndex = stepOrder.indexOf(step.workflow_step)

    for (let i = 0; i < currentStepIndex; i++) {
      const prevStep = workflowSteps.find((s) => s.workflow_step === stepOrder[i])
      if (prevStep && !prevStep.is_completed) {
        return false
      }
    }

    return true
  }

  const handleSignStep = (step: WorkflowStep) => {
    setCurrentStep(step)
    setShowSignature(true)
  }

  const handleSignature = async (signatureData: string, signerName: string, notes?: string) => {
    if (!currentStep) return

    try {
      // Create signature record
      const { data: signature, error: sigError } = await supabase
        .from("signatures")
        .insert({
          signature_data: signatureData,
          signer_id: currentUserId,
          signer_name: signerName,
          signer_role: currentUserRole,
          signature_type: currentStep.workflow_step,
          reference_id: referenceId,
          reference_type: referenceType,
          notes,
        })
        .select()
        .single()

      if (sigError) throw sigError

      // Update workflow step
      const { error: workflowError } = await supabase
        .from("sign_off_workflows")
        .update({
          is_completed: true,
          completed_by: currentUserId,
          signature_id: signature.id,
          completed_at: new Date().toISOString(),
          notes,
        })
        .eq("id", currentStep.id)

      if (workflowError) throw workflowError

      setShowSignature(false)
      setCurrentStep(null)
      await loadWorkflowData()
      onWorkflowUpdate?.()
    } catch (error) {
      console.error("Error saving signature:", error)
      alert("Failed to save signature. Please try again.")
    }
  }

  const getStepIcon = (step: WorkflowStep) => {
    if (step.is_completed) {
      return <CheckCircle className="h-4 w-4 text-green-600" />
    } else if (canSignStep(step)) {
      return <PenTool className="h-4 w-4 text-blue-600" />
    } else {
      return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStepStatus = (step: WorkflowStep) => {
    if (step.is_completed) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>
    } else if (canSignStep(step)) {
      return <Badge className="bg-blue-100 text-blue-800">Ready to Sign</Badge>
    } else {
      return <Badge variant="secondary">Pending</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading workflow...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sign-off Workflow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workflowSteps.length === 0 ? (
              <p className="text-muted-foreground">No workflow steps configured</p>
            ) : (
              workflowSteps.map((step) => (
                <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStepIcon(step)}
                    <div>
                      <div className="font-medium">
                        {step.workflow_step.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                      </div>
                      <div className="text-sm text-muted-foreground">Required: {step.required_role}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStepStatus(step)}
                    {canSignStep(step) && (
                      <Button size="sm" onClick={() => handleSignStep(step)}>
                        Sign
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {signatures.length > 0 && <SignatureDisplay signatures={signatures} />}
      </div>

      {showSignature && currentStep && (
        <DigitalSignature
          onSignature={handleSignature}
          onCancel={() => {
            setShowSignature(false)
            setCurrentStep(null)
          }}
          signerName={currentUserName}
          title={`Sign: ${currentStep.workflow_step.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}`}
          description={`Please sign to complete the ${currentStep.workflow_step.replace(/_/g, " ")} step`}
        />
      )}
    </>
  )
}
