import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"

export default function TechnicianLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <ProtectedRoute allowedRoles={["Technician"]}>{children}</ProtectedRoute>
}
