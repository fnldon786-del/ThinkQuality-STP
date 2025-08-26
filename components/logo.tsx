"use client"

import Image from "next/image"
import { useState } from "react"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  customLogo?: string
  customName?: string
}

export function Logo({ size = "md", showText = true, customLogo, customName }: LogoProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-xl",
    lg: "text-2xl",
  }

  const logoSrc = customLogo || "/images/stp-logo.png"
  const brandName = customName || "ThinkQuality"

  // Use placeholder if image failed to load
  const finalImageSrc = imageError ? "/generic-company-logo.png" : logoSrc

  console.log("[v0] Logo component rendering with src:", finalImageSrc)

  return (
    <div className="flex items-center space-x-2">
      <div className={`${sizeClasses[size]} relative flex-shrink-0`}>
        {imageLoading && <div className="absolute inset-0 bg-muted animate-pulse rounded" />}
        <Image
          src={finalImageSrc || "/placeholder.svg"}
          alt="Logo"
          fill
          className="object-contain"
          onLoad={() => {
            setImageLoading(false)
            console.log("[v0] Logo image loaded successfully")
          }}
          onError={() => {
            setImageError(true)
            setImageLoading(false)
            console.log("[v0] Logo image failed to load, using placeholder")
          }}
          priority={size === "lg"}
        />
      </div>
      {showText && <h1 className={`${textSizeClasses[size]} font-bold text-foreground`}>{brandName}</h1>}
    </div>
  )
}
