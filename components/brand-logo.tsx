"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { createBrowserClient } from "@supabase/ssr"

interface BrandLogoProps {
  size?: "sm" | "md" | "lg"
  showText?: boolean
  className?: string
}

interface BrandingConfig {
  customer_logo_url?: string
  company_name?: string
  primary_color?: string
  secondary_color?: string
}

export function BrandLogo({ size = "md", showText = true, className = "" }: BrandLogoProps) {
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  useEffect(() => {
    fetchBranding()
  }, [])

  const fetchBranding = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from("profiles").select("company_name").eq("id", user.id).single()

      if (profile?.company_name) {
        // Try to get company-specific branding
        const { data: companyBranding } = await supabase
          .from("company_branding")
          .select("*")
          .eq("company_name", profile.company_name)
          .single()

        if (companyBranding) {
          setBranding(companyBranding)
        } else {
          // Fallback to default branding with company name
          setBranding({ company_name: profile.company_name })
        }
      }
    } catch (error) {
      console.error("Error fetching branding:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return { logo: "w-6 h-6", text: "text-sm" }
      case "lg":
        return { logo: "w-12 h-12", text: "text-2xl" }
      default:
        return { logo: "w-8 h-8", text: "text-xl" }
    }
  }

  const sizeClasses = getSizeClasses()

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${sizeClasses.logo} bg-muted rounded-lg animate-pulse`} />
        {showText && <div className="h-6 w-32 bg-muted rounded animate-pulse" />}
      </div>
    )
  }

  // Show customer logo if available
  if (branding?.customer_logo_url) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${sizeClasses.logo} relative overflow-hidden rounded-lg`}>
          <Image
            src={branding.customer_logo_url || "/placeholder.svg"}
            alt={`${branding.company_name || "Company"} Logo`}
            fill
            className="object-contain"
          />
        </div>
        {showText && branding.company_name && (
          <h1 className={`${sizeClasses.text} font-bold text-foreground`}>{branding.company_name}</h1>
        )}
      </div>
    )
  }

  // Show STP Engineering logo for STP Engineering company
  if (branding?.company_name === "STP Engineering (Pty) LTD") {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${sizeClasses.logo} relative overflow-hidden rounded-lg`}>
          <Image src="/images/stp-logo.png" alt="STP Engineering Logo" fill className="object-contain" />
        </div>
        {showText && <h1 className={`${sizeClasses.text} font-bold text-foreground`}>STP Engineering</h1>}
      </div>
    )
  }

  // Default ThinkQuality branding
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`${sizeClasses.logo} bg-primary rounded-lg flex items-center justify-center`}
        style={{ backgroundColor: branding?.primary_color || undefined }}
      >
        <span className="text-sm font-bold text-primary-foreground">TQ</span>
      </div>
      {showText && (
        <h1 className={`${sizeClasses.text} font-bold text-foreground`}>{branding?.company_name || "ThinkQuality"}</h1>
      )}
    </div>
  )
}
