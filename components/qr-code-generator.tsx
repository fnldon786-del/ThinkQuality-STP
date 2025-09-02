"use client"

import { useEffect, useRef } from "react"
import QRCode from "qrcode"

interface QRCodeGeneratorProps {
  value: string
  size?: number
  className?: string
}

export function QRCodeGenerator({ value, size = 200, className = "" }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) console.error("QR Code generation error:", error)
        },
      )
    }
  }, [value, size])

  return (
    <div className={`flex flex-col items-center space-y-2 ${className}`}>
      <canvas ref={canvasRef} className="border rounded-lg" />
      <p className="text-xs text-muted-foreground text-center">Scan to access machine portal</p>
    </div>
  )
}
