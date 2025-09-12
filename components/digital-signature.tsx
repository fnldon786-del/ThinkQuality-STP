"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, RotateCcw, Check } from "lucide-react"

interface DigitalSignatureProps {
  onSignature: (signatureData: string, signerName: string, notes?: string) => void
  onCancel: () => void
  signerName?: string
  title?: string
  description?: string
  required?: boolean
}

export function DigitalSignature({
  onSignature,
  onCancel,
  signerName = "",
  title = "Digital Signature",
  description = "Please sign below to confirm",
  required = true,
}: DigitalSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)
  const [name, setName] = useState(signerName)
  const [notes, setNotes] = useState("")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 200

    // Set drawing styles
    ctx.strokeStyle = "#000000"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    // Fill with white background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSignature(true)
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  const handleSubmit = () => {
    if (!hasSignature && required) {
      alert("Please provide a signature")
      return
    }

    if (!name.trim()) {
      alert("Please enter your name")
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const signatureData = canvas.toDataURL("image/png")
    onSignature(signatureData, name.trim(), notes.trim() || undefined)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          <div className="space-y-2">
            <Label htmlFor="signer-name">Full Name</Label>
            <input
              id="signer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border border-input rounded-md bg-background"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Signature</Label>
            <div className="border border-input rounded-md p-2 bg-white">
              <canvas
                ref={canvasRef}
                className="w-full h-32 cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={clearSignature} disabled={!hasSignature}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <span className="text-xs text-muted-foreground flex items-center">
                {hasSignature ? "Signature captured" : "Draw your signature above"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="signature-notes">Notes (Optional)</Label>
            <Textarea
              id="signature-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={2}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSubmit} className="flex-1">
              <Check className="h-4 w-4 mr-1" />
              Confirm Signature
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
